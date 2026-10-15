---
description: "Pomodoro Technique focus timer as a right-Sidebar tab: a 25-minute work phase, short breaks, and a long break every fourth session, with a countdown ring, skip/reset controls, a guide capsule, and a keyboard shortcut."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-pomodoro

English | [中文](README.zh.md)

## Summary

This package contributes one right-Sidebar tab type: the **Pomodoro Timer**. The tab runs the classic cycle — 25 minutes of focus, a 5-minute short break, and a 15-minute long break after every fourth session — as a countdown ring with start/pause, reset, and skip controls. The cycle settings shown under the controls are the fixed constants; nothing here is configurable.

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

Open the tab from the right Sidebar's guide page — the **Pomodoro Timer** capsule — or with the registered shortcut (⌘⇧T on desktop macOS, ⌘⌥⇧T on web macOS). The shortcut is blocked with a hint when no Session is on screen to host the tab. Only one timer per pane: opening it again reveals the existing tab.

Press ▶ Start and the ring counts down; ⏸ Pause keeps the remaining time, and ▶ Resume continues from it. ↺ Reset returns to a fresh 25-minute work phase and clears the session count; ⏭ Skip ends the current phase immediately and stops. When a phase runs out the timer advances itself — work into a short or long break, break back into work — and waits there, not running, until started again.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

### Registration

The browser plugin registers the `pomodoro` tab type with `ctx.sidebarRightTabs`, its body into the keyed `sidebar.right.pane.tab` seat under the definition's id, the guide capsule and keyboard shortcut from the same definition, and the `pomodoro` locale dictionaries. The chip title needs no title seat: the registry captures the definition's `title()` when the tab opens, and the title never changes.

### Timer

`PomodoroPanel` holds one `PomodoroState` and a 250 ms interval running only while `isRunning`. Each tick feeds the wall-clock delta since the previous tick to a pure `advance` reducer, so pauses, long breaks, and background-tab throttling never accumulate drift inside a mounted tab. Phase boundaries reset the ring to the next phase's duration and leave the timer stopped.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

These pages cover the tab system the package registers into and the shortcut surface.

- [ui-sidebar-right](../ui-sidebar-right/README.md) — the tab registry, the keyed body seat, and the guide page.
- [shortcuts](../shortcuts/README.md) — the command catalog the timer's shortcut registers into.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side timer that registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define what the tab can and cannot do; they are current package constraints.

- **Fixed durations** — 25/5/15 minutes and the four-session cycle are constants; there is no settings surface to change them and nothing is persisted.
- **Progress lives in the mounted tab** — closing the tab or switching away from a Session discards the running timer; reopening starts a fresh work phase.
- **No completion alerts** — a finished phase only repaints the panel; no sound, toast, or notification asks the user to return.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
