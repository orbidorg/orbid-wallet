'use client';

import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
                        {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        {isEs ? 'Última actualización: 11 de diciembre, 2024' : 'Last Updated: December 11, 2024'}
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-pink max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '1. Introducción' : '1. Introduction'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'OrbId Wallet ("nosotros", "nuestro") es operado por OrbId Labs, una organización con sede en Colombia. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información personal cuando usas nuestra aplicación de billetera descentralizada.'
                                : 'OrbId Wallet ("we", "our", "us") is operated by OrbId Labs, a Colombia-based organization. This Privacy Policy explains how we collect, use, and protect your personal information when you use our decentralized wallet application.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '2. Información que Recopilamos' : '2. Information We Collect'}
                        </h2>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '2.1 Información que Proporcionas' : '2.1 Information You Provide'}
                        </h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li><strong>{isEs ? 'Correo Electrónico:' : 'Email Address:'}</strong> {isEs ? 'Para autenticación y comunicación' : 'For account authentication and communication'}</li>
                            <li><strong>{isEs ? 'Dirección de Wallet:' : 'Wallet Address:'}</strong> {isEs ? 'Tu dirección blockchain de World Chain conectada vía World ID' : 'Your World Chain blockchain address connected via World ID'}</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '2.2 Información Recopilada Automáticamente' : '2.2 Information Collected Automatically'}
                        </h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Información del Dispositivo: Tipo de dispositivo, sistema operativo, navegador' : 'Device Information: Device type, operating system, browser type'}</li>
                            <li>{isEs ? 'Datos de Ubicación: País, región, ciudad (derivados de la dirección IP)' : 'Location Data: Country, region, city (derived from IP address)'}</li>
                            <li>{isEs ? 'Datos de Uso: Tiempos de inicio de sesión, funciones usadas, actividad de transacciones' : 'Usage Data: Login times, features used, transaction activity'}</li>
                            <li>{isEs ? 'Información de Sesión: Duración y frecuencia del uso de la app' : 'Session Information: Duration and frequency of app usage'}</li>
                        </ul>

                        <h3 className="text-lg font-medium text-zinc-200 mt-4 mb-2">
                            {isEs ? '2.3 Verificación World ID' : '2.3 World ID Verification'}
                        </h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Estado de Verificación: Si estás verificado como humano único' : 'Verification Status: Whether you are verified as a unique human'}</li>
                            <li>{isEs ? 'Hash de World ID: Prueba anonimizada de verificación (NO almacenamos datos biométricos)' : 'World ID Hash: Anonymized proof of verification (we do NOT store biometric data)'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '3. Cómo Usamos tu Información' : '3. How We Use Your Information'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            {isEs ? 'Usamos la información recopilada para:' : 'We use collected information to:'}
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Proporcionar y mantener el servicio OrbId Wallet' : 'Provide and maintain the OrbId Wallet service'}</li>
                            <li>{isEs ? 'Autenticar tu identidad y propiedad de wallet' : 'Authenticate your identity and wallet ownership'}</li>
                            <li>{isEs ? 'Mejorar nuestra aplicación y experiencia de usuario' : 'Improve our application and user experience'}</li>
                            <li>{isEs ? 'Generar estadísticas agregadas para desarrollo' : 'Generate aggregated statistics for development purposes'}</li>
                            <li>{isEs ? 'Cumplir con obligaciones legales' : 'Comply with legal obligations'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '4. Compartición de Datos' : '4. Data Sharing'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            <strong>{isEs ? 'No vendemos tus datos personales.' : 'We do NOT sell your personal data.'}</strong>
                        </p>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Solo compartimos información con: proveedores de servicios (Supabase para base de datos, Brevo para emails), autoridades legales cuando sea requerido, y servicios blockchain (transacciones son públicas por naturaleza).'
                                : 'We only share information with: service providers (Supabase for database, Brevo for emails), legal authorities when required, and blockchain services (transactions are public by nature).'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '5. Retención de Datos' : '5. Data Retention'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Retenemos datos de cuenta mientras tu cuenta esté activa. Los datos de análisis se agregan después de 90 días. Puedes solicitar eliminación contactando a support@orbidwallet.com.'
                                : 'We retain account data while your account is active. Analytics data is aggregated after 90 days. You may request deletion by contacting support@orbidwallet.com.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '6. Tus Derechos' : '6. Your Rights'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            {isEs ? 'Tienes derecho a:' : 'You have the right to:'}
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                            <li>{isEs ? 'Acceder a tus datos personales' : 'Access your personal data'}</li>
                            <li>{isEs ? 'Corregir información inexacta' : 'Correct inaccurate information'}</li>
                            <li>{isEs ? 'Solicitar eliminación de cuenta' : 'Request account deletion'}</li>
                            <li>{isEs ? 'Exportar tus datos' : 'Export your data'}</li>
                            <li>{isEs ? 'Retirar consentimiento' : 'Withdraw consent'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '7. Seguridad' : '7. Security'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Implementamos cifrado de extremo a extremo, autenticación segura mediante World ID, y auditorías de seguridad regulares. Sin embargo, ninguna transmisión por internet es 100% segura.'
                                : 'We implement end-to-end encryption, secure authentication via World ID, and regular security audits. However, no internet transmission is 100% secure.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '8. Usuarios Internacionales' : '8. International Users'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'OrbId Labs opera desde Colombia. Tus datos pueden ser transferidos y procesados en países diferentes al tuyo. Al usar nuestro servicio, consientes estas transferencias.'
                                : 'OrbId Labs operates from Colombia. Your data may be transferred and processed in countries different from yours. By using our service, you consent to these transfers.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '9. Menores de Edad' : '9. Children\'s Privacy'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Nuestro servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información de menores.'
                                : 'Our service is not intended for users under 18 years of age. We do not knowingly collect information from minors.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '10. Cambios a Esta Política' : '10. Changes to This Policy'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs
                                ? 'Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos por email o dentro de la aplicación.'
                                : 'We may update this policy occasionally. We will notify you of significant changes via email or within the application.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {isEs ? '11. Contáctanos' : '11. Contact Us'}
                        </h2>
                        <p className="text-zinc-300 leading-relaxed">
                            {isEs ? 'Para preguntas sobre privacidad:' : 'For privacy questions:'}
                        </p>
                        <ul className="list-none text-zinc-300 space-y-1 mt-2">
                            <li>📧 <a href="mailto:privacy@orbidwallet.com" className="text-pink-400 hover:text-pink-300">privacy@orbidwallet.com</a></li>
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
