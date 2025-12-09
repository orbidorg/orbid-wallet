/**
 * Email translations for server-side email sending
 * These are separate from client-side translations to avoid importing React in server code
 */

export type SupportedLanguage = 'en' | 'es' | 'zh' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'ar';

interface EmailTranslations {
    subject: string;
    title: string;
    subtitle: string;
    expiresIn: string;
    ignoreNotice: string;
}

const emailTranslations: Record<SupportedLanguage, EmailTranslations> = {
    en: {
        subject: 'is your OrbId Wallet login code',
        title: 'Your Login Code',
        subtitle: 'Enter this code to sign in to OrbId Wallet',
        expiresIn: 'This code expires in 10 minutes',
        ignoreNotice: "If you didn't request this code, you can safely ignore this email.",
    },
    es: {
        subject: 'es tu código de inicio de sesión de OrbId Wallet',
        title: 'Tu Código de Acceso',
        subtitle: 'Ingresa este código para iniciar sesión en OrbId Wallet',
        expiresIn: 'Este código expira en 10 minutos',
        ignoreNotice: 'Si no solicitaste este código, puedes ignorar este correo.',
    },
    zh: {
        subject: '是您的 OrbId Wallet 登录验证码',
        title: '您的登录验证码',
        subtitle: '输入此验证码以登录 OrbId Wallet',
        expiresIn: '此验证码将在10分钟后过期',
        ignoreNotice: '如果您没有请求此验证码，请忽略此邮件。',
    },
    hi: {
        subject: 'आपका OrbId Wallet लॉगिन कोड है',
        title: 'आपका लॉगिन कोड',
        subtitle: 'OrbId Wallet में साइन इन करने के लिए यह कोड दर्ज करें',
        expiresIn: 'यह कोड 10 मिनट में समाप्त हो जाएगा',
        ignoreNotice: 'अगर आपने इस कोड का अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।',
    },
    pt: {
        subject: 'é o seu código de login do OrbId Wallet',
        title: 'Seu Código de Login',
        subtitle: 'Digite este código para entrar no OrbId Wallet',
        expiresIn: 'Este código expira em 10 minutos',
        ignoreNotice: 'Se você não solicitou este código, pode ignorar este email.',
    },
    fr: {
        subject: "est votre code de connexion OrbId Wallet",
        title: 'Votre Code de Connexion',
        subtitle: 'Entrez ce code pour vous connecter à OrbId Wallet',
        expiresIn: 'Ce code expire dans 10 minutes',
        ignoreNotice: "Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.",
    },
    de: {
        subject: 'ist Ihr OrbId Wallet Anmeldecode',
        title: 'Ihr Anmeldecode',
        subtitle: 'Geben Sie diesen Code ein, um sich bei OrbId Wallet anzumelden',
        expiresIn: 'Dieser Code läuft in 10 Minuten ab',
        ignoreNotice: 'Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.',
    },
    ja: {
        subject: 'があなたのOrbId Walletログインコードです',
        title: 'ログインコード',
        subtitle: 'OrbId Walletにサインインするには、このコードを入力してください',
        expiresIn: 'このコードは10分後に期限切れになります',
        ignoreNotice: 'このコードをリクエストしていない場合は、このメールを無視してください。',
    },
    ko: {
        subject: '은(는) OrbId Wallet 로그인 코드입니다',
        title: '로그인 코드',
        subtitle: 'OrbId Wallet에 로그인하려면 이 코드를 입력하세요',
        expiresIn: '이 코드는 10분 후에 만료됩니다',
        ignoreNotice: '이 코드를 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.',
    },
    ar: {
        subject: 'هو رمز تسجيل الدخول إلى OrbId Wallet',
        title: 'رمز تسجيل الدخول',
        subtitle: 'أدخل هذا الرمز لتسجيل الدخول إلى OrbId Wallet',
        expiresIn: 'ينتهي هذا الرمز خلال 10 دقائق',
        ignoreNotice: 'إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني.',
    },
};

export function getEmailTranslations(lang: string): EmailTranslations {
    const supportedLang = (Object.keys(emailTranslations).includes(lang) ? lang : 'en') as SupportedLanguage;
    return emailTranslations[supportedLang];
}
