# Dk Connect

一个开源、可自托管的数字社交名片。纯静态网页，无账号、数据库或后端。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

打开终端显示的本地地址。生产构建：`npm run build`，结果在 `dist/`。

## 配置自己的名片

**只需编辑 [`src/config.ts`](src/config.ts)。** 修改姓名、简介、头像、主题及社交卡片。卡片按 `cards` 数组顺序显示；增删或移动对象即可调整顺序。

- `avatar`：放在 `public/` 下的图片路径，如 `/avatar.jpg`；留空显示姓名首字母。
- `theme`：`light` 或 `dark`，默认黑色；`language`：`zh` 或 `en`，默认中文。页面右上角可随时切换，并在本机记住偏好。姓名、简介与社交卡片可配置中文/英文对象（如 `{ zh: "微信", en: "WeChat" }`），也支持共用字符串。
- `url`：GitHub 等公开网页用 `https://...`，Telegram 用 `https://t.me/用户名`，邮件用 `mailto:地址`，电话用 `tel:号码`。没有可靠网页跳转的平台可以不填。
- `account`：展示及复制的账号；`copy: true` 显示复制按钮。
- `qrImage`：微信、QQ 等平台的**真实个人二维码图片**。将图片放入 `public/`，填写 `/wechat-qr.png` 这样的路径。不能根据微信号或 QQ 号可靠生成加好友二维码，因此未设置时只提供复制账号；界面会明确提示未提供二维码。

示例卡片：

```ts
{ id: 'website', name: '个人网站', subtitle: '了解更多', account: 'example.com', icon: 'web', url: 'https://example.com', copy: true }
```

页面资料已配置为 Han_B1ng。没有链接、账号或二维码的平台显示“即将连接”，入口禁用。

## 分享

页面顶部“分享名片”会在支持 Web Share API 的浏览器中调用系统分享菜单。其他浏览器可点击底部“查看分享二维码”，显示当前页面链接的二维码并复制链接。建议使用 HTTPS 部署，以便复制功能在现代浏览器中正常工作；页面也提供旧浏览器的复制降级。

## 部署

### Cloudflare Pages

连接 Git 仓库，构建命令 `npm run build`，输出目录 `dist`。保持默认根路径即可。

### GitHub Pages

项目仓库站点（`用户名.github.io/仓库名/`）构建时设置 `BASE_PATH=/仓库名/`，然后运行 `npm run build`，把 `dist/` 发布到 GitHub Pages。用户站点（`用户名.github.io/`）不需要设置 `BASE_PATH`。

部署在子路径时，头像和二维码的 `/avatar.jpg` 等路径会自动添加构建时的 `BASE_PATH` 前缀，无需重复填写仓库名。

## 协议

MIT，见 [LICENSE](LICENSE)。

## 视觉与交互

默认黑色、中文，支持中英和明暗主题切换。卡片从屏幕左侧进入，边移动边翻转，二维码背面落位后翻回头像正面，与表头同时完成入场；主要文字先揭示，小文字随后渐显。遵循系统“减少动态效果”。

大名片为单体双面卡。鼠标悬浮产生压力倾斜，点击上下左右区域翻转，可连续翻转；四个角的 14% × 14% 区域保留为中性死区。翻转期间仍跟随鼠标压力。触屏点击翻转，键盘支持 Enter、空格、方向键；Esc 重置。点击大名片不会复制链接，分享和复制入口在分享面板。

弹窗支持 Esc 关闭、焦点循环与关闭后焦点归位。字体使用系统字体，无外部字体请求。

当前资料已填入头像、GitHub、Telegram、微信、双邮箱、QQ、飞书、抖音、X 和 Instagram。Telegram 使用用户提供的二维码原图；微信、QQ 与抖音目前按账号复制添加。飞书邀请链接可能随平台规则失效，可在配置文件里更新。


### 动效与分享海报

- 大名片带鼠标反光、悬浮和地面投影；头像带点击波纹。
- 社交卡片使用鼠标聚光、图标上浮、箭头反馈和复制成功对勾；卡片滚动进入视野时依次出现。
- 支持的浏览器中，主题切换从按钮位置圆形展开；其他浏览器正常切换。减少动态效果时关闭持续动画。
- 底部“分享名片”打开分享面板，选择“保存分享海报”，生成预览后点击“下载海报”，得到 1080 × 1440 PNG。海报跟随当前主题与语言，全程本地生成。
- 正式上线后可在 `src/config.ts` 填写 `publicUrl`（完整 HTTPS 网址），固定分享链接与二维码；留空则使用当前页面地址。本地地址生成的二维码只用于预览。

## 本仓库部署

此仓库通过 `.github/workflows/pages.yml` 在推送 `main` 后自动构建并发布。正式域名为 `https://hanb1ng.com/`，生产构建 `BASE_PATH=/`，`src/config.ts` 的 `publicUrl` 使用同一地址。

合并部署前核对 GitHub Pages 自定义域名配置；不要用项目子目录路径覆盖域名根路径。Cloudflare Pages 同样使用根路径、`npm run build` 和 `dist`。

## 维护与验证

- 推荐 Node.js 22.12+。`npm ci` 安装锁定依赖，`npm test` 运行几何测试，`npm run build` 同时执行 TypeScript 严格检查和生产构建。
- 首次运行浏览器回归：`npx playwright install chromium`，然后 `npm run test:e2e`。测试使用独立的本地 5175 端口，不占用预览页面。
- 也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向已安装的 Chrome 可执行文件。
- `npm run og:render` 重新生成 `public/og-image.png`；修改姓名、头像、正式域名时同步检查 `index.html` 中的分享元信息。
- `src/components/` 按表头、首页、名片、社交网格、分享弹窗和页尾拆分；`src/composables/` 分别管理偏好、卡片交互、入场、光条、语言过渡和分享，`usePageModel.ts` 负责装配。`src/locales/zh.ts`、`en.ts` 管理文案，由 `src/i18n.ts` 统一导出；`src/styles/` 按基础布局、卡片和入场分组，`src/style.css` 按原顺序导入。
- `v1-final` 保留已确认的视觉版本。维护分支的提交不会自动更新线上站点，合并 `main` 后才触发发布。

### 性能验证

首屏离开视野或标签页进入后台时，持续装饰动画会暂停；返回后恢复，系统减少动态效果设置继续有效。海报代码在导出时加载，Telegram 二维码原图在打开弹窗时加载。

本地验证生产构建：先运行 `npm run build`，再运行 `E2E_PREVIEW=1 npm run test:e2e`。此模式使用本地静态预览服务；改写源码配置的用例仅在普通 `npm run test:e2e` 中执行。真实网络延迟和缓存应在部署后检查。
