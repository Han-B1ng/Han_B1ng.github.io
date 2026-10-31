/** All personal content lives here. Cards appear in array order. */
export type Language = "zh" | "en";
export type Localized = string | Record<Language, string>;
export type SocialCard = {
  id: string;
  name: Localized;
  subtitle: Localized;
  account: string;
  icon: string;
  /** Public HTTPS URL, mailto:, or tel:. Omit if the platform cannot be opened reliably. */
  url?: string;
  /** A real account QR image in public/, if supplied by the owner. */
  qrImage?: string;
  copy?: boolean;
};

export const config = {
  publicUrl: "", name: "Alex", handle: "@example", monogram: "A",
  greeting: { zh: "很高兴与你相遇。", en: "Good to meet you." },
  bio: { zh: "", en: "" }, availability: { zh: "欢迎联系", en: "Open to connect" },
  location: { zh: "", en: "" }, avatar: "", theme: "dark" as "dark" | "light",
  language: "zh" as Language,
  cards: [
    {id:"github",name:"GitHub",subtitle:{zh:"代码与项目",en:"Code and projects"},account:"github.com",icon:"github",url:"https://github.com"},
    {id:"email",name:"Email",subtitle:{zh:"发一封邮件",en:"Send an email"},account:"hello@example.com",icon:"mail",url:"mailto:hello@example.com",copy:true},
    {id:"website",name:{zh:"网站",en:"Website"},subtitle:{zh:"了解更多",en:"Find out more"},account:"example.com",icon:"globe",url:"https://example.com"},
    ...["telegram","wechat","qq","feishu","douyin","x","instagram"].map(icon=>({id:icon,name:icon,subtitle:{zh:"配置你的账号",en:"Configure your account"},account:"",icon,copy:true}))
  ] as SocialCard[],
};
