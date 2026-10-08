/** All personal content lives here. Cards appear in array order. */
export type Language = 'zh' | 'en'
export type Localized = string | Record<Language, string>
export type SocialCard = {
  id: string
  name: Localized
  subtitle: Localized
  account: string
  icon: string
  /** Public HTTPS URL, mailto:, or tel:. Omit if the platform cannot be opened reliably. */
  url?: string
  /** A real account QR image in public/, if supplied by the owner. */
  qrImage?: string
  copy?: boolean
}

export const config = {
  publicUrl: 'https://han-b1ng.github.io/Han_B1ng.github.io/', // Canonical GitHub Pages URL.
  name: 'Han_B1ng',
  handle: '@Han_B1ng',
  monogram: 'H',
  greeting: { zh: '祝你天天开心。', en: 'Wishing you happiness every day.' },
  bio: { zh: '', en: '' },
  availability: { zh: '欢迎联系', en: 'Open to connect' },
  location: { zh: '', en: '' },
  avatar: '/avatar.jpg',
  theme: 'dark' as 'dark' | 'light',
  language: 'zh' as Language,
  cards: [
    { id: 'github', name: 'GitHub', subtitle: { zh: '代码与项目', en: 'Code and projects' }, account: 'Han-B1ng', icon: 'github', url: 'https://github.com/Han-B1ng', copy: true },
    { id: 'telegram', name: 'Telegram', subtitle: { zh: '扫码或直接联系', en: 'Scan or say hello' }, account: '@HAN_B1NG', icon: 'telegram', url: 'https://t.me/HAN_B1NG', qrImage: '/telegram-qr.png', copy: true },
    { id: 'wechat', name: { zh: '微信', en: 'WeChat' }, subtitle: { zh: '复制微信号添加', en: 'Copy my WeChat ID' }, account: 'h18235796206', icon: 'wechat', copy: true },
    { id: 'email-163', name: { zh: '网易邮箱', en: 'Email · 163' }, subtitle: { zh: '发邮件给我', en: 'Send me an email' }, account: 'hbx061105@163.com', icon: 'mail', url: 'mailto:hbx061105@163.com', copy: true },
    { id: 'email-gmail', name: 'Gmail', subtitle: { zh: '发邮件给我', en: 'Send me an email' }, account: 'hanb1ng6206@gmail.com', icon: 'mail', url: 'mailto:hanb1ng6206@gmail.com', copy: true },
    { id: 'qq', name: 'QQ', subtitle: { zh: '复制 QQ 号添加', en: 'Copy my QQ number' }, account: '2409417348', icon: 'qq', copy: true },
    { id: 'feishu', name: { zh: '飞书', en: 'Feishu' }, subtitle: { zh: '申请添加联系人', en: 'Add me as a contact' }, account: '添加联系人', icon: 'feishu', url: 'https://www.feishu.cn/invitation/page/add_contact/?token=feeidf26-7d2f-46db-be5e-24fa21f77a95' },
    { id: 'douyin', name: { zh: '抖音', en: 'Douyin' }, subtitle: { zh: '复制抖音号搜索', en: 'Copy my Douyin ID' }, account: '@han_b1ng', icon: 'douyin', copy: true },
    { id: 'x', name: 'X', subtitle: { zh: '看看我在说什么', en: 'Find me on X' }, account: '@hanb1ng6206', icon: 'x', url: 'https://x.com/hanb1ng6206', copy: true },
    { id: 'instagram', name: 'Instagram', subtitle: { zh: '分享一些日常', en: 'Moments and stories' }, account: 'han_b1ng', icon: 'instagram', url: 'https://www.instagram.com/han_b1ng/', copy: true },
  ] as SocialCard[],
}
