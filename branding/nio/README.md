# NIO personal build

This branch layers personal branding on top of the chat-provider-switch feature.
It is separate from the official feature proposal.

| Branch                            | Purpose                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `review/provider-switch-official` | Snapshot of `d42eb9ad2`, submitted in upstream PR #7455; original Paseo branding |
| `brand/nio-provider-switch`       | Same feature plus this NIO personal appearance                                   |

The official PR continues to use `feat/chat-provider-switch`. Brand changes are
not part of that PR. The original working tree and its unrelated plugin edits are
separate from this worktree.

## Appearance

- Static app marks use a black/near-black NIO silhouette on light surfaces and a
  white silhouette on dark surfaces. Welcome, open-project, startup-error and
  app-tool identity surfaces share the same component.
- The Dock/app icon and startup animation retain the supplied cyan/blue/purple/pink
  gradient. Explicit monochrome masks and system notification icons stay monochrome.
- Startup shimmer uses the NIO silhouette on web and native, and respects reduced
  motion. It animates within a fixed-size box so the surrounding layout stays stable.
- Home and Settings no longer render the Star, Sponsor or Community promotional row.
- Provider icons (Claude, Codex, Copilot, etc.) still identify their respective agents.

[Home screenshot](screenshots/home-light.png) · [Welcome, light](screenshots/welcome-light.png)

`reference.png` is the supplied raster reference. The reusable vector geometry and
color stops live in `packages/app/src/brand/nio-mark.json`. `mark.svg` is the exported
gradient symbol, and `dock.svg` is its macOS icon layout.

## Dock sizing and generated assets

The Dock master is 1024 × 1024 with an 832px rounded tile inset by 96px. Its opaque
bounds measure approximately 81.4% of the canvas width, avoiding both an undersized
mark and edge-to-edge oversized artwork. No development branch stamp covers the mark.
The ICNS includes standard 16px, 32px, 128px, 256px and 512px representations and their
2× variants, through 1024px. PNG and Windows ICO are also generated, alongside PWA,
Apple touch, favicon/status, native foreground, splash and notification assets.

Regenerate using the installed image tooling:

```sh
node scripts/generate-nio-assets.mjs
```

Run on macOS to regenerate ICNS with `iconutil`. The generator uses the vector source;
it does not upscale the supplied 240px reference for large Dock assets.

## Run the isolated preview

After installing dependencies and building server packages:

```sh
npm ci
npm run build:server
PASEO_HOME="$PWD/.dev/nio-home" PASEO_DEV_MANAGED_HOME=1 PASEO_LISTEN=127.0.0.1:6771 EXPO_PORT=8084 PASEO_ELECTRON_REMOTE_DEBUGGING_PORT=9429 npm run dev --workspace=@getpaseo/desktop
```

The desktop is named **Paseo NIO**, with a separate packaged app ID
`sh.paseo.nio.desktop`. Packaged release metadata points to `willyuhot/paseo` rather
than the upstream release feed. No release publishing or installation into
`/Applications` was performed for this change.

## Validation

- All workspace typechecks passed.
- Lint: 0 warnings and 0 errors; changed-file formatting and whitespace checks passed.
- Server/dependencies/CLI build and desktop-main build passed.
- Existing app-config tests: 2 passed. Existing desktop icon-helper tests: 10 passed.
- Electron preview on macOS showed the monochrome home mark and no promotional row.
- Independent browser checks exercised the light welcome page without changing the
  user's current Electron page. The dark-theme silhouette follows the existing theme
  foreground color; dark visual acceptance remains part of the user's manual check.
- `iconutil` successfully read back all 10 ICNS representations; PNG alpha bounds were
  measured to check Dock sizing.

Native OS screenshot capture was unavailable in this session, so the physical Dock's
relative appearance still needs human visual confirmation. The resource dimensions
and live desktop icon-loading path were checked. Windows, Linux, iOS and Android
runtime appearance were not tested.
