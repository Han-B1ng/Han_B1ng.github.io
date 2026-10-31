# Dk Motion Kit

MIT 开源的 Vue 3 + TypeScript 动效 starter、19 个 SVG 图标，以及自包含 Codex skill。从 [Dk Connect](https://github.com/Han-B1ng/Han_B1ng.github.io) 的迭代中整理；示例不含原站个人头像、联系方式或二维码。

发布位置：现有公开仓库的独立 `assets/dk-motion-kit` 分支；与个人站主分支隔离。

## 直接运行 / Quick start

需要 Node.js 22.13+、npm、Python 3（生成 starter 时）。

```sh
git clone --branch assets/dk-motion-kit --single-branch https://github.com/Han-B1ng/Han_B1ng.github.io.git dk-motion-kit
cd dk-motion-kit
npm ci
npm run dev
npm run build
npm test
```

打开终端显示的本地地址。编辑 `skills/dk-motion-kit/assets/starter/src/config.ts` 设置内容、主题、语言与卡片顺序。默认中文、深色；无后端、数据库、注册或分析追踪。

## 资产与动画

- [19 个独立 SVG](skills/dk-motion-kit/assets/icons)：24×24、1.5px 描边；可直接复制或通过 SVG 内联导入。用 CSS `color` 控制内联 SVG；作为 img 使用时 currentColor 不继承宿主颜色。图标装饰用途时加 aria-hidden，图标按钮需文字标签。
- [Vue Icon 组件](skills/dk-motion-kit/assets/starter/src/Icon.vue)：`<Icon name="github" />`。品牌图形为简化线条表达，非官方认证图标。
- [3D 卡片](skills/dk-motion-kit/assets/starter/src/components/IdentityCard.vue)：悬浮、压力倾斜、四区域连续翻转、正反面、动态投影和环线。
- [入场时间轴](skills/dk-motion-kit/assets/starter/src/composables/useEntranceTimeline.ts)：响应布局测量、卡片移动翻转、分层文字渐显与表头同步。
- [表头光条](skills/dk-motion-kit/assets/starter/src/composables/useHeaderLight.ts)：启动扫描、滚动中断与位置交接。
- [社交发现](skills/dk-motion-kit/assets/starter/src/components/SocialGrid.vue)：桌面滚动发现、卡片依次浮入；手机采用简化布局。
- 深浅主题、中英过渡、二维码与分享弹层；头像缺省为字母；空账号禁用；离屏循环暂停与减少动态效果适配。

这是完整 starter，不是可随意单独拖入项目的 npm 组件库。组件依赖共享 model、CSS 与 composable；单独迁移应按 [架构说明](skills/dk-motion-kit/references/motion-architecture.md) 一起迁移依赖。分享海报按需加载；外链先确认再打开。

## 安装和使用 skill

将 `skills/dk-motion-kit` 整个目录复制到 `~/.codex/skills/dk-motion-kit`，不要覆盖自己修改过的同名目录。重新打开 Codex 会话后调用：

> 使用 $dk-motion-kit 给我的 Vue 页面加入压力卡片和连续翻转，保留现有视觉风格。

skill 自带全部源资产，不需要依赖此仓库的其他路径。生成独立项目：

```sh
python3 skills/dk-motion-kit/scripts/create_starter.py /tmp/my-motion-page
cd /tmp/my-motion-page
npm install
npm run dev
```

目标目录必须为空或不存在；脚本拒绝覆盖已有项目。

## 学习资料

- [设计语言与迭代经验](skills/dk-motion-kit/references/design-language.md)
- [动画架构与常见故障](skills/dk-motion-kit/references/motion-architecture.md)
- [验证和性能检查](skills/dk-motion-kit/references/validation.md)

## 部署

执行 `npm run build`，输出位于 `skills/dk-motion-kit/assets/starter/dist`，可部署到任意静态托管。GitHub Pages 项目路径构建时设置 `BASE_PATH=/repository-name/`；自定义域名根路径为 `/`。配置 publicUrl 为真实公开地址后分享二维码才适用于其他设备；留空会使用当前页面地址，本地地址无法用于跨设备分享。自行添加 canonical、OG 图与 CNAME；本仓库不自动改动域名或发布个人站。

## License

[MIT](LICENSE)。品牌商标权和第三方依赖不包含在本项目授权内，见 [第三方说明](THIRD_PARTY_NOTICES.md)。代码源自 Dk Connect contributors；此仓库不附带原站个人美术素材。

English: Clone, run `npm ci && npm run dev`, customize `src/config.ts` inside the bundled starter. Copy the entire skill directory to your Codex skills folder, or use its Python bootstrap script to create an independent Vue application. See the linked references for architecture, design rationale and validation boundaries.
