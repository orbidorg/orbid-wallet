import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | OrbId Wallet',
    description: 'Terms of Service for OrbId Wallet - Your secure World Chain wallet',
};

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <a href="/" className="text-pink-400 hover:text-pink-300 text-sm mb-4 inline-block">
                        ← Back to OrbId Wallet
                    </a>
                    <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-zinc-500 text-sm">Last Updated: December 11, 2024</p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-pink max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            By accessing or using OrbId Wallet (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).
                            If you disagree with any part of these terms, you may not access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            OrbId Wallet is a non-custodial cryptocurrency wallet application designed for World Chain that enables:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Viewing of World Chain token balances</li>
                            <li>Sending and receiving of tokens</li>
                            <li>Integration with World ID for identity verification</li>
                            <li>Portfolio tracking functionality</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
                        <p className="text-zinc-300 leading-relaxed">You must be:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>At least 18 years of age</li>
                            <li>Legally capable of entering binding contracts</li>
                            <li>Not prohibited from using cryptocurrency services in your jurisdiction</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Account and Security</h2>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">4.1 Account Creation</h3>
                        <p className="text-zinc-300 leading-relaxed">
                            You may create an account using World App authentication or email verification.
                        </p>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">4.2 Your Responsibilities</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Maintain the security of your email account</li>
                            <li>Protect access to your World ID</li>
                            <li>Never share authentication codes with anyone</li>
                            <li>Immediately report unauthorized access</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">4.3 Non-Custodial Nature</h3>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-2">
                            <p className="text-yellow-200 font-medium mb-2">⚠️ IMPORTANT</p>
                            <p className="text-zinc-300">
                                OrbId Wallet is non-custodial. We do NOT store your private keys, have access to your funds,
                                have the ability to recover lost assets, or control your blockchain transactions.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Transactions</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            All transactions are executed on World Chain and are irreversible once confirmed.
                            Network fees may apply (currently free for World ID verified users).
                            Transaction history is permanently recorded on-chain.
                        </p>
                        <p className="text-zinc-300 leading-relaxed">
                            You are solely responsible for verifying recipient addresses, understanding the tokens you transact,
                            and ensuring sufficient balance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Prohibited Activities</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">You agree NOT to:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Use the Service for illegal activities</li>
                            <li>Attempt to hack, exploit, or abuse the Service</li>
                            <li>Conduct money laundering or terrorist financing</li>
                            <li>Impersonate other users or entities</li>
                            <li>Interfere with the Service&apos;s operation</li>
                            <li>Use bots or automated systems without permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Disclaimers</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            OrbId Wallet does NOT provide investment advice, tax guidance, or legal counsel.
                        </p>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            You acknowledge that cryptocurrency values are volatile, past performance doesn&apos;t guarantee future results,
                            technical failures may affect access, and regulatory changes may impact functionality.
                        </p>
                        <p className="text-zinc-400 text-sm uppercase">
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW: We are not liable for lost funds due to user error,
                            blockchain network issues, or third-party service failures. Our total liability shall not exceed $100 USD.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Governing Law</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            These Terms are governed by the laws of Colombia. Disputes shall first attempt informal resolution,
                            with formal disputes subject to arbitration in Colombia.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">10. Modifications</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We reserve the right to modify these Terms. Continued use after changes constitutes acceptance.
                            Material changes will be notified 30 days in advance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
                        <div className="bg-zinc-900 rounded-lg p-4">
                            <p className="text-zinc-300">
                                <strong className="text-white">OrbId Labs</strong><br />
                                Colombia<br />
                                Email: <a href="mailto:legal@orbid.io" className="text-pink-400 hover:text-pink-300">legal@orbid.io</a><br />
                                Support: <a href="mailto:support@orbid.io" className="text-pink-400 hover:text-pink-300">support@orbid.io</a>
                            </p>
                        </div>
                    </section>

                    <section className="border-t border-zinc-800 pt-6">
                        <p className="text-zinc-500 text-sm italic">
                            By using OrbId Wallet, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
