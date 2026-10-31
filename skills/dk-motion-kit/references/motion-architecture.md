# 动画架构与迁移映射

组件位于 assets/starter/src/components，逻辑位于 composables；style.css 按顺序引入 styles/ 下的基础、卡片、入场、表头、发现和性能样式。先检查实际 import 与 CSS 选择器，不要只复制一个组件。

| 功能 | 入口和依赖 |
| --- | --- |
| 压力和连续翻转 | IdentityCard.vue、useIdentityCard.ts、cardGeometry.ts、卡片 CSS、共享 model |
| 入场与文字 | HeroSection.vue、useEntranceTimeline.ts、入场 CSS |
| 启动光条与滚动交接 | TopBar.vue、useHeaderLight.ts、useScrollHeader.ts、表头 CSS |
| 社交发现 | SocialGrid.vue、usePageModel.ts 的滚动状态、发现 CSS |
| 语言与主题 | usePreferences.ts、useLanguageTransition.ts、locales/、i18n.ts |
| 分享 | ShareDialog.vue、SharePanel.vue、useShare.ts、poster.ts、qrcode |
| 性能预算 | useMotionBudget.ts、performance CSS |

## 单一物理卡片

稳定命中平面 → 入场移动 → 闲置悬浮 → 压力层 → 累计翻转层 → 正反面。两面背面剔除，反面 rotateY(180deg) 加薄厚偏移。透明渐显放在不破坏 3D 子树的外层。opacity、filter 等 grouping 属性可能使 preserve-3d 扁平化；不同 z-index 本身不是普遍失效的充分条件。

翻转角度累计，每次加减 180°；绕 X 翻转后继续处理本地坐标朝向，不应每次跳回零角。悬浮压力独立于翻转动画，避免途中停顿。四个投影探针通过 surfacePoint 反投影得到本地坐标；镜像面和透视应使用同一几何映射，接近侧面时退化返回 null。

## 响应式时间线

用未变换的布局锚点计算出发/落位位置；不要在动画中反复读取已经变换的卡片作为下一帧基准。刷新、窗口尺寸变化和字体加载都可能改变测量，不能依赖一次缓存的固定飞入距离。一个时间轴负责协调多个元素，但每个 transform 层只有一个写入者。

## 交接状态

启动扫描、快速交接、滚动进度是不同状态。保留 WAAPI 填充帧，等待响应式样式应用后再取消动画。恢复顶部时防抖，避免接近零滚动时反复隐藏显示。共享跨组件响应式字段要保持 ref/computed，不能复制普通值后期待同步。

循环装饰可离屏暂停；有限时长的落位/交接不能被一并冻结。多动画元素要分别设置 play-state。卸载时集中取消 RAF、timer、observer 和事件监听。
