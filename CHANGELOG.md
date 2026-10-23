# Changelog

## Unreleased

## v1.3.0 - 2026-07-24

### Added
- Added Manifest V3 support for modern Chromium browsers, including Brave.
- Added service-worker coordination with offscreen-document audio playback.
- Added startup state reannouncement so the service worker can reconstruct
  Fallen London page state after sleeping or browser restart.
- Added shared settings and message/event constants modules.
- Added persisted mute and volume settings with safe defaults.
- Added an in-page volume slider with a persisted 35% default.
- Added unknown-area detection for valid Fallen London area IDs missing from
  bundled mappings.
- Added in-page custom area assignment for unmapped areas.
- Added extension-owned IndexedDB storage for custom area mappings and imported
  local audio blobs.
- Added a 32 MB custom-audio import validation limit before data-URL transfer
  begins.
- Added `tracks/README.md` so the expected empty asset directory survives source
  control.

### Changed
- Changed the background architecture from Manifest V2 background-page behavior
  to Manifest V3 service-worker behavior.
- Changed audio playback to run through an offscreen document in Chromium.
- Changed browser API access to flow through the shared `extension_api.js`
  compatibility layer where practical.
- Changed configuration defaults to be read from shared settings instead of
  scattered hardcoded values.
- Changed mapping delivery to merge user-created area mappings over bundled
  `mappings.json` data without modifying the bundled file.
- Narrowed web-accessible resources so user-supplied bundled track files are not
  exposed to Fallen London pages.
- Updated README documentation for SEEKER, Manifest V3, custom audio assignment,
  and contributor architecture.
- Removed unreachable migration leftovers and unused custom-audio helper exports.

### Fixed
- Fixed Manifest V2 incompatibility that disabled the extension in modern
  Chromium browsers.
- Fixed startup mute restoration so restored mute state is applied before
  playback begins.
- Fixed the inherited TrackPlayer mute bug where newly created gain nodes could
  fade up to audible volume while the extension was muted.
- Fixed unnecessary restarts when Fallen London reannounced the same active
  location and track.
- Fixed locator-panel collapse and expand behavior after settings UI changes.
- Fixed custom audio import handling for oversized files by rejecting them before
  expensive data-URL reading begins.
