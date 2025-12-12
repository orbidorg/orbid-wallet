import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | OrbId Wallet',
    description: 'Privacy Policy for OrbId Wallet - How we collect, use, and protect your data',
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <a href="/" className="text-pink-400 hover:text-pink-300 text-sm mb-4 inline-block">
                        ← Back to OrbId Wallet
                    </a>
                    <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                    <p className="text-zinc-500 text-sm">Last Updated: December 11, 2024</p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-pink max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            OrbId Wallet (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is operated by OrbId Labs, a Colombia-based organization.
                            This Privacy Policy explains how we collect, use, and protect your personal information when you use our
                            decentralized wallet application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">2.1 Information You Provide</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li><strong>Email Address:</strong> For account authentication and communication</li>
                            <li><strong>Wallet Address:</strong> Your World Chain blockchain address connected via World ID</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">2.2 Information Collected Automatically</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Device Information: Device type, operating system, browser type</li>
                            <li>Location Data: Country, region, city (derived from IP address)</li>
                            <li>Usage Data: Login times, features used, transaction activity</li>
                            <li>Session Information: Duration and frequency of app usage</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">2.3 World ID Verification</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Verification Status: Whether you are verified as a unique human</li>
                            <li>World ID Hash: Anonymized proof of verification (we do NOT store biometric data)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">We use collected information to:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Provide and maintain the OrbId Wallet service</li>
                            <li>Authenticate your identity and wallet ownership</li>
                            <li>Improve our application and user experience</li>
                            <li>Generate aggregated statistics for development purposes</li>
                            <li>Comply with legal obligations</li>
                            <li>Present project metrics to potential investors and grant programs</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Legal Basis for Processing (GDPR)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-700">
                                        <th className="text-left py-2 text-zinc-300 font-medium">Data Type</th>
                                        <th className="text-left py-2 text-zinc-300 font-medium">Legal Basis</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-400">
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-2">Email, Wallet</td>
                                        <td className="py-2">Contractual necessity</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-2">World ID verification</td>
                                        <td className="py-2">Legitimate interest (security)</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-2">Device info, Location</td>
                                        <td className="py-2">Legitimate interest (analytics)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Usage statistics</td>
                                        <td className="py-2">Consent</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
                            <p className="text-emerald-200 font-medium">✓ We do NOT sell your personal data.</p>
                        </div>
                        <p className="text-zinc-300 leading-relaxed mb-3">We may share information with:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li><strong>World Foundation:</strong> Aggregated, anonymized statistics for grant applications</li>
                            <li><strong>Blockchain Networks:</strong> Transaction data is public on World Chain</li>
                            <li><strong>Service Providers:</strong> Supabase (database), Alchemy (blockchain API)</li>
                            <li><strong>Legal Requirements:</strong> When required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li><strong>Account Data:</strong> Retained while your account is active</li>
                            <li><strong>Usage Analytics:</strong> Anonymized after 24 months</li>
                            <li><strong>Transaction History:</strong> Permanently stored on blockchain (immutable)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            Under GDPR and applicable laws, you have the right to:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Correct inaccurate data</li>
                            <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
                            <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                            <li><strong>Objection:</strong> Opt-out of certain data processing</li>
                        </ul>
                        <p className="text-zinc-300 mt-3">
                            To exercise these rights, contact: <a href="mailto:privacy@orbid.io" className="text-pink-400 hover:text-pink-300">privacy@orbid.io</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">We implement industry-standard security measures:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>Encrypted connections (HTTPS/TLS)</li>
                            <li>Row-level security in databases</li>
                            <li>No storage of private keys or seed phrases</li>
                            <li>Regular security audits</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            OrbId Wallet is not intended for users under 18 years of age.
                            We do not knowingly collect data from minors.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We may update this Privacy Policy periodically. We will notify you of significant changes
                            via email or in-app notification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
                        <div className="bg-zinc-900 rounded-lg p-4">
                            <p className="text-zinc-300">
                                <strong className="text-white">OrbId Labs</strong><br />
                                Colombia<br />
                                Email: <a href="mailto:privacy@orbid.io" className="text-pink-400 hover:text-pink-300">privacy@orbid.io</a><br />
                                Data Protection Officer: <a href="mailto:dpo@orbid.io" className="text-pink-400 hover:text-pink-300">dpo@orbid.io</a>
                            </p>
                        </div>
                    </section>

                    <section className="border-t border-zinc-800 pt-6">
                        <p className="text-zinc-500 text-sm italic">
                            For users in the European Union, you have the right to lodge a complaint with your local data protection authority.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
