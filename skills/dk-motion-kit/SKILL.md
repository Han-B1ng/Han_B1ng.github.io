---
name: dk-motion-kit
description: Reuse Dk Motion Kit SVG icons and Vue 3 motion assets to build or repair floating 3D cards, continuous flips, coordinated entrances, header light sweeps, scroll discovery, monochrome themes and Chinese-English transitions. Use when a user requests these effects or explicitly invokes Dk Motion Kit; includes a self-contained starter and design/debugging references.
---

# Dk Motion Kit

## Choose the smallest integration

Inspect the destination framework, existing work, motion preferences and layout first. Preserve unrelated files and established visual choices. For icons alone use `assets/icons/` or `assets/starter/src/Icon.vue`; do not copy the entire page.

For a new Vue page, run `python3 scripts/create_starter.py DESTINATION` relative to this skill. The script refuses nonempty destinations. Then install dependencies in the generated project and run its build and tests. All personal content belongs in `src/config.ts`; placeholder accounts are intentionally inactive. Never copy the source site's personal identity or invitation tokens.

For an existing Vue project, read `references/motion-architecture.md`, select one effect, and carry over its component, composable, styles and geometry dependencies together. Components use a shared page model and are not drop-in independent library exports. Adapt that model rather than inventing unsupported props.

## Build coordinated motion

Read `references/design-language.md` before choosing choreography. Give each transform layer one owner: entrance travel, idle rig, pressure and cumulative flip must remain separate. Measure stable layout anchors, not transformed card bounds. Use a single timeline for coordinated card/text/header arrival. Preserve pressure during a click turn. Map the pointer onto the currently projected face rather than only reversing a percentage.

Avoid opacity/filter flattening on preserve-3d ancestors. Do not assert that z-index alone universally disables depth rendering. Keep startup scan and scroll progress states separate; retain the final animated frame until the new DOM state is applied to avoid a flash.

Respect reduced motion, touch input, keyboard navigation and focus restoration. Do not intercept normal scrolling to force an animation. Mobile may use simpler effects. Consult `references/validation.md` and actually run the relevant checks; distinguish measured results from visual expectations.

## Deliver

Document copied assets, configuration, dependencies and validation. Keep MIT notices. Platform symbols are simplified and do not grant trademark rights. Publishing, deploying or modifying an external service still requires the user's authorization; this skill does not imply it.
