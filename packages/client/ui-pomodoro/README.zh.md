---
description: "以右侧栏标签页形式提供的番茄工作法专注计时器：25 分钟专注、短休息、每第四个番茄钟后一次长休息，配有倒计时圆环、跳过/重置控件、指南卡片与键盘快捷键。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-pomodoro

[English](README.md) | 中文

## 摘要

本包贡献一个右侧栏标签页类型：**番茄钟**。该页运行经典循环——25 分钟专注、5 分钟短休息、每第四个番茄钟后 15 分钟长休息——以倒计时圆环呈现，并带开始/暂停、重置与跳过控件。控件下方展示的周期参数即固定常量；本包不提供任何可配置项。

## 目录

- [使用本包](#use-this-package)
- [实现内部](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在右侧栏指南页点击**番茄钟**卡片打开该页，或使用已注册的快捷键（桌面 macOS 为 ⌘⇧T，Web macOS 为 ⌘⌥⇧T）。当主视图没有会话可承载该页时，快捷键会带提示被阻止。每个窗格只有一个计时器：再次打开会显示既有标签页。

按 ▶ 开始 后圆环倒计时；⏸ 暂停 保留剩余时间，▶ 继续 从该处继续。↺ 重置 回到全新的 25 分钟专注阶段并清零番茄钟计数；⏭ 跳过 立即结束当前阶段并停止。阶段时间耗尽时计时器自动推进——专注转入短或长休息，休息结束回到专注——并停在新阶段等待再次开始。

-----

<a id="understand-the-implementation"></a>
## 实现内部

<details>
<summary>实现内部细节 — 点击展开</summary>

### 注册

浏览器插件通过 `ctx.sidebarRightTabs` 注册 `pomodoro` 标签页类型，把面板注册进以定义 id 为键的 `sidebar.right.pane.tab` 具名席位，指南卡片与键盘快捷键来自同一类型定义，并注册 `pomodoro` 文案词典。标题胶囊无需标题席位：打开标签页时注册表即捕获定义的 `title()`，标题不再变化。

### 计时器

`PomodoroPanel` 持有一个 `PomodoroState`，以及仅在 `isRunning` 时运行的 250 毫秒间隔。每次 tick 把自上一 tick 以来的墙上时钟差值交给纯函数 `advance` 归约器，因此暂停、长休息与后台标签页节流都不会在已挂载的标签页内累积漂移。阶段边界把圆环重置为下一阶段时长并停止运行。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

以下页面覆盖本包注册进入的标签页体系与快捷键表面。

- [ui-sidebar-right](../ui-sidebar-right/README.zh.md) — 标签页注册表、具名体席位与指南页。
- [shortcuts](../shortcuts/README.zh.md) — 番茄钟快捷键注册进入的命令目录。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包是浏览器侧计时器，未注册任何面向模型的内容。

#### KV Cache 影响

无；本包既不组装也不发送 provider 请求。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

以下限制界定了该页能与不能展示的内容；它们是当前的包约束。

- **固定时长** — 25/5/15 分钟与四番茄钟循环是常量；没有修改它们的设置界面，也不持久化任何状态。
- **进度只存在于已挂载的标签页** — 关闭标签页或切换会话会丢弃运行中的计时器；重新打开从全新的专注阶段开始。
- **无完成提醒** — 阶段结束只重绘面板；没有声音、吐司或通知提示用户返回。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文 — 点击展开</summary>

无。

</details>
