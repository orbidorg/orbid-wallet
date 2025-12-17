'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function TermsOfServicePage() {
    const { lang } = useI18n();
    const isEs = lang === 'es';

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-pink-400 hover:text-pink-300 text-sm mb-4 inline-block">
                        ← {isEs ? 'Volver a OrbId Wallet' : 'Back to OrbId Wallet'}
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">
                        {isEs ? 'Términos de Servicio' : 'Terms of Service'}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        {isEs ? 'Última actualización: 11 de diciembre, 2024' : 'Last Updated: December 11, 2024'}
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-pink max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '1. Aceptación de Términos' : '1. Acceptance of Terms'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Al acceder o usar OrbId Wallet ("Servicio"), aceptas estar sujeto a estos Términos de Servicio ("Términos"). Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.'
                                : 'By accessing or using OrbId Wallet ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '2. Descripción del Servicio' : '2. Description of Service'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            {isEs
                                ? 'OrbId Wallet es una aplicación de billetera de criptomonedas no custodiada diseñada para World Chain que permite:'
                                : 'OrbId Wallet is a non-custodial cryptocurrency wallet application designed for World Chain that enables:'}
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Visualización de balances de tokens de World Chain' : 'Viewing of World Chain token balances'}</li>
                            <li>{isEs ? 'Envío y recepción de tokens' : 'Sending and receiving of tokens'}</li>
                            <li>{isEs ? 'Integración con World ID para verificación de identidad' : 'Integration with World ID for identity verification'}</li>
                            <li>{isEs ? 'Funcionalidad de seguimiento de portafolio' : 'Portfolio tracking functionality'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '3. Elegibilidad' : '3. Eligibility'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">{isEs ? 'Debes:' : 'You must be:'}</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Tener al menos 18 años de edad' : 'At least 18 years of age'}</li>
                            <li>{isEs ? 'Ser legalmente capaz de celebrar contratos vinculantes' : 'Legally capable of entering binding contracts'}</li>
                            <li>{isEs ? 'No estar prohibido de usar servicios de criptomonedas en tu jurisdicción' : 'Not prohibited from using cryptocurrency services in your jurisdiction'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '4. Cuenta y Seguridad' : '4. Account and Security'}
                        </h2>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '4.1 Creación de Cuenta' : '4.1 Account Creation'}
                        </h3>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Puedes crear una cuenta usando la autenticación de World App o verificación por email.'
                                : 'You may create an account using World App authentication or email verification.'}
                        </p>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '4.2 Tus Responsabilidades' : '4.2 Your Responsibilities'}
                        </h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Mantener la seguridad de tu cuenta de email' : 'Maintain the security of your email account'}</li>
                            <li>{isEs ? 'Proteger el acceso a tu World ID' : 'Protect access to your World ID'}</li>
                            <li>{isEs ? 'Nunca compartir códigos de autenticación con nadie' : 'Never share authentication codes with anyone'}</li>
                            <li>{isEs ? 'Reportar inmediatamente cualquier acceso no autorizado' : 'Immediately report unauthorized access'}</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '4.3 Naturaleza No Custodiada' : '4.3 Non-Custodial Nature'}
                        </h3>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-2">
                            <p className="text-yellow-200 font-medium mb-2">⚠️ {isEs ? 'IMPORTANTE' : 'IMPORTANT'}</p>
                            <p className="text-zinc-300">
                                {isEs
                                    ? 'OrbId Wallet es no custodiada. NO almacenamos tus claves privadas, no tenemos acceso a tus fondos, no podemos recuperar activos perdidos, ni controlamos tus transacciones blockchain.'
                                    : 'OrbId Wallet is non-custodial. We do NOT store your private keys, have access to your funds, have the ability to recover lost assets, or control your blockchain transactions.'}
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '5. Transacciones' : '5. Transactions'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            {isEs
                                ? 'Todas las transacciones se ejecutan en World Chain y son irreversibles una vez confirmadas. Pueden aplicarse tarifas de red (actualmente gratis para usuarios verificados con World ID). El historial de transacciones se registra permanentemente on-chain.'
                                : 'All transactions are executed on World Chain and are irreversible once confirmed. Network fees may apply (currently free for World ID verified users). Transaction history is permanently recorded on-chain.'}
                        </p>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Eres el único responsable de verificar las direcciones de destinatario, entender los tokens que transaccionas, y asegurar saldo suficiente.'
                                : 'You are solely responsible for verifying recipient addresses, understanding the tokens you transact, and ensuring sufficient balance.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '6. Actividades Prohibidas' : '6. Prohibited Activities'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            {isEs ? 'Aceptas NO:' : 'You agree NOT to:'}
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Usar el Servicio para actividades ilegales' : 'Use the Service for illegal activities'}</li>
                            <li>{isEs ? 'Intentar hackear, explotar o abusar del Servicio' : 'Attempt to hack, exploit, or abuse the Service'}</li>
                            <li>{isEs ? 'Conducir lavado de dinero o financiamiento terrorista' : 'Conduct money laundering or terrorist financing'}</li>
                            <li>{isEs ? 'Suplantar a otros usuarios o entidades' : 'Impersonate other users or entities'}</li>
                            <li>{isEs ? 'Violar derechos de propiedad intelectual' : 'Violate intellectual property rights'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '7. Limitación de Responsabilidad' : '7. Limitation of Liability'}
                        </h2>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-zinc-300">
                                {isEs
                                    ? 'OrbId Labs no será responsable por: pérdidas de criptomonedas o activos digitales, transacciones fallidas o retrasadas, acceso no autorizado a tu cuenta, fluctuaciones de precio de tokens, errores de usuario incluyendo direcciones incorrectas, o tiempo de inactividad del servicio.'
                                    : 'OrbId Labs shall NOT be liable for: loss of cryptocurrency or digital assets, failed or delayed transactions, unauthorized access to your account, token price fluctuations, user errors including incorrect addresses, or service downtime.'}
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '8. Cambios a los Términos' : '8. Changes to Terms'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página y entrarán en vigor inmediatamente. El uso continuado del Servicio constituye aceptación de los términos modificados.'
                                : 'We reserve the right to modify these terms at any time. Changes will be posted on this page and become effective immediately. Continued use of the Service constitutes acceptance of modified terms.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '9. Ley Aplicable' : '9. Governing Law'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Estos Términos se regirán por las leyes de Colombia. Cualquier disputa se resolverá en los tribunales de Bogotá, Colombia.'
                                : 'These Terms shall be governed by the laws of Colombia. Any disputes shall be resolved in the courts of Bogotá, Colombia.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '10. Contacto' : '10. Contact'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs ? 'Para preguntas sobre estos términos:' : 'For questions about these terms:'}
                        </p>
                        <ul className="list-none text-zinc-300 space-y-1 mt-2">
                            <li>📧 <a href="mailto:legal@orbidwallet.com" className="text-pink-400 hover:text-pink-300">legal@orbidwallet.com</a></li>
                            <li>🌐 <a href="https://orbidwallet.com" className="text-pink-400 hover:text-pink-300">orbidwallet.com</a></li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
                    <p className="text-zinc-500 text-sm">
                        © 2024 OrbId Labs. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
                    </p>
                </div>
            </div>
        </main>
    );
}
