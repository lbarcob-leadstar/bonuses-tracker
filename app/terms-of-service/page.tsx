export default function TermsOfServicePage() {
  const updatedAt = 'July 20, 2026'

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#0f1824' }}>
      <div className="mx-auto w-full max-w-3xl rounded-2xl p-6 md:p-8" style={{ background: 'rgba(20, 30, 45, 0.94)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: '#FFE799' }}>
          Terms of Service
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Last updated: {updatedAt}
        </p>

        <div className="space-y-6" style={{ color: 'rgba(255,255,255,0.82)' }}>
          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using this service, you agree to these Terms of Service and any applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>2. Use of the Service</h2>
            <p>
              You agree to use the service only for lawful purposes and in a way that does not harm the platform,
              other users, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>3. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for activities
              that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>4. Intellectual Property</h2>
            <p>
              All content, trademarks, and software related to this service are owned by their respective owners and
              protected by applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>5. Disclaimer</h2>
            <p>
              The service is provided on an "as is" and "as available" basis without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential
              damages arising from use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>7. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes means you accept
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f5f8ff' }}>8. Contact</h2>
            <p>
              For legal questions, contact: support@unitedgamblers.com
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
