---
description: "Web 设置「内置插件」分区中的只读技能与 MCP 服务两个标签页：主视图会话可用的技能目录，以及全部已加载的 mcp-client Loader 条目。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skill-mcp

[English](README.md) | 中文

## 摘要

本包在插件列表旁贡献两个只读标签页。**技能**页列出主视图所展示会话可用的、供用户调用的技能：名称、描述、可选的使用时机说明，以及 SKILL.md 路径。**MCP 服务**页列出所有加载 `@deepseek-ai/dsh-mcp-client` 的 Loader 条目——全局条目与各 Agent 预设组合行——并展示启用状态、根 Fiber 阶段与禁用条件。

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

打开设置中的「内置插件」分区，选择**技能**或**MCP 服务**标签页。两个页面都在首次挂载时惰性读取 Host，重试时重新读取；均不写入设置、不建立 MCP 连接、也不加载技能正文。

技能页跟随主视图所持有的会话。没有这样的会话时显示提示而非列表；切换会话会按新会话的组成重新读取目录。搜索框按名称与描述过滤。当模型未被提供该技能时，行上显示**仅用户**调用标签；`whenToUse` 与技能文件绝对路径在存在时作为详情行展示。

MCP 服务页按精确模块说明符 `@deepseek-ai/dsh-mcp-client` 过滤 Host 插件清单。全局 Loader 行出现在**全局 MCP 服务**下；由某个 Agent 预设组合命名的行出现在该预设分组下，声明了 `!!js` 禁用条件时一并展示。已停用、条件启用与启动失败的行带有标签；`pending`、`loading`、`unloading` 阶段以状态圆点标记。

-----

<a id="understand-the-implementation"></a>
## 实现内部

<details>
<summary>实现内部细节 — 点击展开</summary>

### 注册

浏览器半侧通过 `ctx.slots.inject()` 注册两个本地化的 `settings.plugins.tab` 贡献——id 为 `skills`（order 20）与 `mcp`（order 30）——因此两者都跟随迟到的 tab 声明、重新声明、语言切换与卸载。导航入口与 tab 外壳由「内置插件」分区拥有。

### 数据

技能走按会话寻址的 `skills/list` Remote：本包注入 `sessions`，从 `ctx.sessions.list` 的 `mainView` 持有计数派生 `SessionId | undefined` 快照，经由 `hooks` 舱位传给组件。MCP 行走 `pluginInventory.list()`；`mcp-view.ts` 把快照投影为全局与预设两个层级，并把启用状态与阶段折叠为每行一个状态。预设名使用预设自载的显示名或 id。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

以下页面覆盖设置分区、Remote 调用与 Host 侧数据源。

- [ui-settings-plugins](../ui-settings-plugins/README.zh.md) — 这两个标签页注册进的「内置插件」分区。
- [ui-settings](../ui-settings/README.zh.md) — 声明 `settings.plugins.tab` 的设置域底座。
- [api-remotes](../../api/remotes/README.zh.md) — `skills.list()` 与 `pluginInventory.list()` 背后的 Remote BFF 面。
- [session-controller](../../api/session-controller/README.zh.md) — 冷可读技能目录的 Host 拥有者。
- [plugin-inventory](../../host/plugin-inventory/README.zh.md) — MCP 页渲染的 Host 侧只读 Loader 投影。

-----

<a id="model-experience"></a>
## 模型体验

无：本包是浏览器侧的设置投影，不注册任何面向模型的内容。

#### KV 缓存影响

无；本包既不组装也不发送模型请求。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

以下限制界定了这两个页面能展示什么、不能展示什么；它们是当前包的约束。

- **无 MCP 连接状态** — `dsh-mcp-client` 没有为其活动连接发布任何 Remote 或事件面；`failOnStartupError: false` 的行即使服务端不可达也保持 `active`，本页只能反映 Loader 阶段。要呈现连接健康度，需先在 Host 侧建立状态服务。
- **无 MCP 配置字段** — transport、`serverName`、`command`、`args` 与 `url` 保留在 cordis.yml 行内，因为清单快照不携带插件配置；本页从不读取文件或进程环境。
- **技能需要主视图会话** — 目录按会话寻址（cwd 与 Agent 预设决定可见集合）；设置面板自身不持有会话，没有持有会话时显示提示而非全局列表。
- **每次挂载或重试读取一次** — 两个页面都不订阅技能文件监视或 Loader 变化；技能编辑与组成变更会在会话切换、重试或重开设置后出现。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
