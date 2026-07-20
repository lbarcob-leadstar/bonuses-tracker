export default function PrivacyPolicyPage() {
  const updatedAt = 'July 20, 2026'

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#0f1824' }}>
      <div className="mx-auto w-full max-w-3xl rounded-2xl p-6 md:p-8" style={{ background: 'rgba(20, 30, 45, 0.94)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: '#FFE799' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Last updated: {updatedAt}
        </p>

        <div className="space-y-6" style={{ color: 'rgba(255,255,255,0.82)' }}>
          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>1. Information We Collect</h2>
            <p>
              We collect account information you provide directly, such as your email address and profile details,
              plus usage data related to bonus tracking activity in the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>2. How We Use Information</h2>
            <p>
              We use your information to provide, maintain, and improve the service, including authentication,
              syncing your progress, and personalizing your dashboard experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>3. Sharing of Information</h2>
            <p>
              We do not sell personal information. We may share limited data with trusted providers that help us run
              the product, such as hosting, analytics, and authentication platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>4. Data Security</h2>
            <p>
              We use reasonable safeguards to protect your information, but no online service can guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>5. Data Retention</h2>
            <p>
              We retain your information while your account is active and as needed to comply with legal obligations
              and resolve disputes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>6. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal data.
              Contact us to submit a request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>7. Contact</h2>
            <p>
              For privacy questions, contact: support@unitedgamblers.com
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
