-- ============================================================
-- 1. PROFILES (roles)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. CASINOS
-- ============================================================
create table public.casinos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bonus_description text not null,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.casinos enable row level security;

-- Everyone (logged in) can read active casinos
create policy "Authenticated users can read active casinos"
  on public.casinos for select
  to authenticated
  using (is_active = true);

-- Only admins can insert/update/delete
create policy "Admins can manage casinos"
  on public.casinos for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- 3. USER_CLAIMS
-- ============================================================
create table public.user_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  casino_id uuid not null references public.casinos on delete cascade,
  claimed_date date not null,
  streak int default 1,
  last_claim_date date,
  updated_at timestamptz default now(),
  unique (user_id, casino_id, claimed_date)
);

alter table public.user_claims enable row level security;

create policy "Users manage own claims"
  on public.user_claims for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. SEED: 103 CASINOS
-- ============================================================
insert into public.casinos (id, name, bonus_description, is_active, sort_order) values
  (gen_random_uuid(), 'Ace.com', 'Daily Wheel (GC + 0.2-0.4 SC)', true, 1),
  (gen_random_uuid(), 'Acorn Fun', 'Daily Mystery Box (up to 6,000 GC + 2 SC)', true, 2),
  (gen_random_uuid(), 'Baba Casino', '1,000 GC + 0.5 SC (increases daily)', true, 3),
  (gen_random_uuid(), 'BankRolla', '10,000 GC + 0.1 SC', true, 4),
  (gen_random_uuid(), 'BigPirate', '10,000 GC + 1 Rum Bottle', true, 5),
  (gen_random_uuid(), 'Carnival Citi', '1,000 SC ($1)', true, 6),
  (gen_random_uuid(), 'Casino Click', 'Spin & Win (up to 5 SC)', true, 7),
  (gen_random_uuid(), 'Chanced', '5,000 GC + 0.1 SC (increases daily)', true, 8),
  (gen_random_uuid(), 'Chip''n WIN', '2,000 GC + 1 Crystal', true, 9),
  (gen_random_uuid(), 'Chumba Casino', '50,000 GC + 0.25 SC (increases daily)', true, 10),
  (gen_random_uuid(), 'Clubs Casino', '2,500 GC + 0.25 SC', true, 11),
  (gen_random_uuid(), 'Cluck.us', 'Daily Bonus Wheel', true, 12),
  (gen_random_uuid(), 'Cool Spin', '2,000 GC + 0.15 SC (increases daily)', true, 13),
  (gen_random_uuid(), 'Crown Coins Casino', '5,000 CC (increases daily)', true, 14),
  (gen_random_uuid(), 'Dara Casino', '10,000 GC + 0.25 SC', true, 15),
  (gen_random_uuid(), 'DingDingDing Casino', '10,000 GC + 0.75 SC (increases daily)', true, 16),
  (gen_random_uuid(), 'Enchanted Casino', '1 Enchanted Coin', true, 17),
  (gen_random_uuid(), 'Fortune Coins', '50,000 GC + 1 FC', true, 18),
  (gen_random_uuid(), 'Fortune Wheelz', 'Daily Bonus Wheel (GC + up to 500 FC)', true, 19),
  (gen_random_uuid(), 'FreeSpin', 'Mystery Gift (Spins or SC)', true, 20),
  (gen_random_uuid(), 'Funrize Casino', 'Daily Wheel Spin', true, 21),
  (gen_random_uuid(), 'FunzCity', '0.2 CC + 2 Free Plays (increases daily)', true, 22),
  (gen_random_uuid(), 'Funzpoints', 'Daily Wheel of Fortune', true, 23),
  (gen_random_uuid(), 'Gains.com', '10,000 GC + 1 SC', true, 24),
  (gen_random_uuid(), 'Global Poker', '1,000 GC + 0.25 SC', true, 25),
  (gen_random_uuid(), 'Gold Treasure Casino', '7,500 GC (increases daily)', true, 26),
  (gen_random_uuid(), 'GoldNLuck', '5,000 GC + 2 SC', true, 27),
  (gen_random_uuid(), 'GoGoGold Win', '3,000 GC + 0.3 SC (increases daily)', true, 28),
  (gen_random_uuid(), 'Hello Millions', '1,500 GC + 0.2 SC', true, 29),
  (gen_random_uuid(), 'High 5 Casino', '0.5 SC', true, 30),
  (gen_random_uuid(), 'iCasino', '5,000 IC (increases daily)', true, 31),
  (gen_random_uuid(), 'Jackpot Go', '2,000 GC + 0.3 SC (increases daily)', true, 32),
  (gen_random_uuid(), 'Jackpota', '1,500 GC + 0.2 SC (increases daily)', true, 33),
  (gen_random_uuid(), 'JackpotRabbit', '0.2 SC', true, 34),
  (gen_random_uuid(), 'Jumbo888', 'Wheel Spin (GC + SC increases daily)', true, 35),
  (gen_random_uuid(), 'Kickr', '5,000 Bits + 0.1-1 Buck(s)', true, 36),
  (gen_random_uuid(), 'Lavish Luck', '100,000 GC + 0.3 SC', true, 37),
  (gen_random_uuid(), 'Legendz', 'Daily Drop (5 Free Spins, 0.1-01 SC, or no prize)', true, 38),
  (gen_random_uuid(), 'Lions Den', '1 Lions Den Coin', true, 39),
  (gen_random_uuid(), 'LoneStar Casino', '5,000 GC + 0.3 SC', true, 40),
  (gen_random_uuid(), 'Lucky Bits Vegas', '1 SC', true, 41),
  (gen_random_uuid(), 'Lucky Hands', '10,000 GC + 0.3 SC', true, 42),
  (gen_random_uuid(), 'Lucky.me', '1,000 GC + 0.2 SC', true, 43),
  (gen_random_uuid(), 'LuckyBird', '0.1 SC (increases daily)', true, 44),
  (gen_random_uuid(), 'LuckyLand Slots', '0.3 SC (increases daily)', true, 45),
  (gen_random_uuid(), 'LuckySlots', '10,000 GC + 1 SC', true, 46),
  (gen_random_uuid(), 'LuckyStake', '1,500 GC + 0.2 SC (increases daily)', true, 47),
  (gen_random_uuid(), 'MaxQuest', '10,000 Quest Coins + 0.5 Max Coins', true, 48),
  (gen_random_uuid(), 'McLuck Casino', '1,500 GC + 0.2 SC', true, 49),
  (gen_random_uuid(), 'MegaBonanza', '1,500 GC + 0.2 SC (increases daily)', true, 50),
  (gen_random_uuid(), 'MegaFrenzy', '2,000 GC + Prize Wheel (0.1-5 SC)', true, 51),
  (gen_random_uuid(), 'Milky Star Slots', '1,000 GC + 0.3 SC', true, 52),
  (gen_random_uuid(), 'Modo.us', '10,000 GC + 0.1 SC', true, 53),
  (gen_random_uuid(), 'MoonSpin', '1,000 GC + 0.5 SC', true, 54),
  (gen_random_uuid(), 'Moozi', '3,000 GC + 0.3 SC', true, 55),
  (gen_random_uuid(), 'MyPrize US', '1,000 GC + 1 SC + Daily Wheel Spin', true, 56),
  (gen_random_uuid(), 'NoLimitCoins', '2,000 GC + 20 SC', true, 57),
  (gen_random_uuid(), 'Play To Win Casino', 'Daily Bonus Wheel', true, 58),
  (gen_random_uuid(), 'PlayFame', '1,000 GC + up to 2.5 SC', true, 59),
  (gen_random_uuid(), 'Playnomic', '1,000 Tokens + 0.1 SC', true, 60),
  (gen_random_uuid(), 'Pulsz', '5,000 GC + 0.3 SC', true, 61),
  (gen_random_uuid(), 'Punt.com', '1,000 GC + 0.1 SC', true, 62),
  (gen_random_uuid(), 'RealPrize', '5,000 GC + 0.3 SC (changes daily)', true, 63),
  (gen_random_uuid(), 'RichSweeps', 'Daily Wheel', true, 64),
  (gen_random_uuid(), 'Rolla Casino', '0.2 SC (increases with VIP level)', true, 65),
  (gen_random_uuid(), 'Rolling Riches', '2,000 GC + 0.2 SC', true, 66),
  (gen_random_uuid(), 'Roxy Moxy', '15,000 GC + 0.2 SC', true, 67),
  (gen_random_uuid(), 'Runewager', '10,000 FC + 1 SC', true, 68),
  (gen_random_uuid(), 'Scarlet Sands', 'The Daily Blaze (changes daily)', true, 69),
  (gen_random_uuid(), 'Sheesh Casino', '5,000 GC + 0.3 SC', true, 70),
  (gen_random_uuid(), 'Sidepot.us', '10,000 GC + 1 SC (must have less than 1 SC in account)', true, 71),
  (gen_random_uuid(), 'Sixty6', '2,000 GC + 0.2 SC', true, 72),
  (gen_random_uuid(), 'Sorcery Reels', '400 GC + 0.1 SC', true, 73),
  (gen_random_uuid(), 'SpeedSweeps', '5,000 GC + 0.2 SC', true, 74),
  (gen_random_uuid(), 'SpinBlitz', '200 GC + 0.1 SC', true, 75),
  (gen_random_uuid(), 'Spinfinite', 'Daily Treasure Chest (prizes vary)', true, 76),
  (gen_random_uuid(), 'SpinQuest', '10,000 GC + 1 SC', true, 77),
  (gen_random_uuid(), 'Splash Coins', '0.2 SC (changes with VIP level)', true, 78),
  (gen_random_uuid(), 'Sportzino', '20,000 GC + 1 SC', true, 79),
  (gen_random_uuid(), 'Spree Casino', '2,000 GC', true, 80),
  (gen_random_uuid(), 'Stackr', '1,000 GC + 0.1 SC (every 12 hours)', true, 81),
  (gen_random_uuid(), 'Stake.us', '10,000 GC + 1 SC', true, 82),
  (gen_random_uuid(), 'StormRush', '10,000 GC + 0.1 SC', true, 83),
  (gen_random_uuid(), 'Sweep Las Vegas', 'Spin Wheel (GC + 0.35-100 SC)', true, 84),
  (gen_random_uuid(), 'Sweeper Casino', '0.1-5 SC', true, 85),
  (gen_random_uuid(), 'SweepJungle', '3 Free Spins (increases daily)', true, 86),
  (gen_random_uuid(), 'SweepNext', '2,000 GC + Daily Mega Spin', true, 87),
  (gen_random_uuid(), 'SweepSlots', '500 GC + 0.5 SC', true, 88),
  (gen_random_uuid(), 'SweepsShark', '0.2 SC', true, 89),
  (gen_random_uuid(), 'Sweepstake.ai', '180,000 GC + 0.2 SC', true, 90),
  (gen_random_uuid(), 'SweepsUSA', '1,000 GC + 0.2 SC + Daily Bonus Wheel', true, 91),
  (gen_random_uuid(), 'TaoFortune', 'Daily Magic Boxes', true, 92),
  (gen_random_uuid(), 'The Money Factory', '1,000 GC + 0.2 SC', true, 93),
  (gen_random_uuid(), 'ToraTora Casino', 'GC + SC (random daily)', true, 94),
  (gen_random_uuid(), 'Vegas Coins', '1,000 GC + 0.2 SC', true, 95),
  (gen_random_uuid(), 'Vegas Gems', 'Daily Login Case', true, 96),
  (gen_random_uuid(), 'VegasGlory', '10,000 GC + 0.5 SC (increases daily)', true, 97),
  (gen_random_uuid(), 'Wild World Casino', '10,000 GC + 0.4 SC', true, 98),
  (gen_random_uuid(), 'WOW Vegas', '1,500 WOW + 0.3 SC (increases daily)', true, 99),
  (gen_random_uuid(), 'Yay Casino', '5,000 GC + 0.5 SC', true, 100),
  (gen_random_uuid(), 'Yotta Games', '1,000 Tokens + 0.1 Yotta Cash', true, 101),
  (gen_random_uuid(), 'Zonko', 'Daily "Power Boost" (random bonus)', true, 102),
  (gen_random_uuid(), 'Zula Casino', '10,000 GC + 1 SC', true, 103);
