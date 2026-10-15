---
description: "Read-only Skills and MCP servers tabs in the Web Settings Plugins section: the main-view session's user-invocable skill catalog and every loaded mcp-client Loader row."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skill-mcp

English | [中文](README.zh.md)

## Summary

This package contributes two read-only tabs beside the Plugin list. The **Skills** tab lists the user-invocable skills of the session the main view shows: each skill's name, description, optional routing guidance, and SKILL.md path. The **MCP servers** tab lists every Loader row that loads `@deepseek-ai/dsh-mcp-client` — global entries and per-preset composition rows — with enablement, root-fiber phase, and disable condition.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Open the Plugins section in Settings and select the **Skills** or **MCP servers** tab. Both tabs read the Host lazily on first mount and refetch on retry; neither writes settings, opens MCP connections, or loads skill bodies.

The Skills tab follows the Session the main view retains. With no such session it shows a hint instead of a list; switching sessions re-reads the catalog under the new session's composition. A search filters the list by name and description. Each row shows the invocation tag **User only** when the model is not offered the skill, and expands nothing: `whenToUse` and the absolute skill file path appear as detail rows when present.

The MCP servers tab filters the Host plugin inventory by the exact module specifier `@deepseek-ai/dsh-mcp-client`. Global Loader rows appear under **Global MCP servers**; rows named by an agent preset composition appear under that preset's section, carrying their `!!js` disable condition when they declare one. Tags mark disabled, conditional, and failed rows; a status dot marks the `pending`, `loading`, and `unloading` phases.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

### Registration

The browser plugin registers two localized `settings.plugins.tab` contributions — ids `skills` (order 20) and `mcp` (order 30) — through `ctx.slots.inject()`, so both follow late tab declaration, redeclaration, locale changes, and teardown. The Plugins section owns the navigation entry and tab chrome.

### Data

Skills ride the Session-addressed `skills/list` Remote: the plugin injects `sessions` and derives a `SessionId | undefined` snapshot from the `mainView` retention count in `ctx.sessions.list`, which reaches the component through the `hooks` compartment. MCP rows ride `pluginInventory.list()`; `mcp-view.ts` projects the snapshot to global and preset scopes, folding enablement and phase into one state per row. Preset names use the preset's own display name or id.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

These pages cover the settings section, the Remote calls, and the Host-side sources.

- [ui-settings-plugins](../ui-settings-plugins/README.md) — the Plugins section these tabs register into.
- [ui-settings](../ui-settings/README.md) — the domain base declaring `settings.plugins.tab`.
- [api-remotes](../../api/remotes/README.md) — the Remote BFF surface behind `skills.list()` and `pluginInventory.list()`.
- [session-controller](../../api/session-controller/README.md) — the Host owner of the cold-readable skill catalog.
- [plugin-inventory](../../host/plugin-inventory/README.md) — the Host-side read-only Loader projection the MCP tab renders.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings projection that registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define what the tabs can and cannot show; they are current package constraints.

- **No MCP connection state** — `dsh-mcp-client` publishes no Remote or event surface for its live connection; a row with `failOnStartupError: false` stays `active` even when its server cannot be reached, and this tab cannot say more than the Loader phase. Surfacing connection health requires a Host-side state service first.
- **No MCP configuration fields** — transport, `serverName`, `command`, `args`, and `url` stay in the cordis.yml row because the inventory snapshot carries no plugin config; the tab never reads files or process environment.
- **Skills require a main-view session** — the catalog is Session-addressed (cwd and agent preset decide the visible set); Settings holds no session itself, so with no retained session the tab shows a hint instead of a global list.
- **One fetch per mount or retry** — neither tab subscribes to skill-file watchers or Loader changes; skill edits and composition changes appear after the session changes, a retry, or reopening Settings.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
