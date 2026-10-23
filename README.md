# FL Genius Loci: SEEKER

FL Genius Loci: SEEKER is a maintained continuation of the original
[FL Genius Loci](https://github.com/lensvol/fl-genius-loci) browser extension
for [Fallen London](https://www.fallenlondon.com/). It plays location-specific
background music while you move through Fallen London.

SEEKER keeps the original extension's spirit and mapping format, updates the
runtime for Manifest V3, and adds small quality-of-life tools for modern
Chromium browsers.

## Credits

The original FL Genius Loci was created by Kirill Borisov and is licensed under
the MIT License. This continuation preserves the original license, attribution,
icon credit, and special thanks. See [LICENSE](LICENSE) for the full license
text.

This project is not affiliated with Failbetter Games. Fallen London and its
music remain the property of their respective owners.

## Browser Compatibility

Version 1.3.0 targets Manifest V3 on modern Chromium browsers, including
Chrome and Brave. Audio playback uses a Manifest V3 service worker plus a
Chromium offscreen document.

Firefox support is not the primary target for this release. The original
Manifest V2 extension worked in Firefox, but SEEKER's current audio architecture
depends on Chromium's offscreen document API.

## Music Files

No copyrighted music files are included with this extension.

You must provide your own legally obtained audio files. Built-in mappings expect
audio files to be placed in the `tracks/` directory. That directory is kept in
the repository with [tracks/README.md](tracks/README.md) so it exists even when
empty.

By default, `mappings.json` expects filenames from the official Fallen London
OST. If your files use different names, edit the `tracks` section in
`mappings.json`.

## Install Unpacked

1. Download or clone this repository.
2. Place any manually supplied bundled tracks in `tracks/`.
3. Open Brave or Chrome.
4. Go to `brave://extensions` or `chrome://extensions`.
5. Enable **Developer mode**.
6. Choose **Load unpacked**.
7. Select this extension folder.
8. Open or reload Fallen London.

Close existing Fallen London tabs before loading or reloading the extension if
the in-page controls do not appear immediately.

## Using The Panel

FL Genius Loci adds two small buttons to Fallen London's top UI:

- Map marker: expands or collapses the locator panel.
- Speaker: toggles mute.

The locator panel shows the detected setting, area, current track, and volume
slider. Volume is saved between browser restarts. Muting does not overwrite the
saved volume.

## Built-In Tracks

For mapped locations, the extension looks up the current Fallen London area or
setting in `mappings.json`, then plays the matching file from `tracks/`.

Known mapped areas continue to use bundled local files exactly as in the
original extension. Known areas with no assigned track show as unassigned rather
than being treated as unknown areas.

## Custom Area Assignments

When Fallen London reports a valid area ID and name that are not present in the
built-in mappings, the locator panel shows a compact assignment prompt.

1. Open the locator panel with the map-marker button.
2. Confirm the displayed area name and area ID.
3. Choose **Choose Audio File**.
4. Select a supported local audio file, such as an MP3.
5. Choose **Save Assignment**.

The extension copies the selected audio into extension-owned IndexedDB storage,
saves a custom mapping for that Fallen London area ID, and starts playback. The
saved assignment is used automatically whenever that area is visited again.

After import, playback no longer depends on the original file path. You can move
or delete the original file and the extension should continue using its imported
copy unless browser extension storage is cleared.

Custom imports currently support files up to **32 MB**. During import, the file
is temporarily transferred as a base64 data URL inside an extension message.
Chrome extension messages are limited to 64 MiB, and base64 adds overhead, so
the 32 MB limit leaves room for safe transfer.

If an imported file is missing from extension storage or cannot be decoded, the
panel shows an error and lets you assign another file.

## Troubleshooting

- **The panel is missing:** reload the Fallen London tab after loading or
  reloading the unpacked extension.
- **No music plays:** confirm the expected MP3 files are present in `tracks/`,
  or assign a custom file for the current unmapped area.
- **The wrong built-in file is expected:** update the `tracks` section of
  `mappings.json` to match your local filenames.
- **Custom import is rejected:** choose a supported audio file no larger than
  32 MB.
- **A custom track no longer plays:** browser extension storage may have been
  cleared, or the imported audio asset may be unreadable. Reassign the file from
  the locator panel.
- **Mute or volume seems wrong after restart:** reload the Fallen London tab so
  the service worker and page can reannounce current state.

## Architecture For Contributors

The extension is intentionally small and keeps compatibility logic isolated.

- `manifest.json` declares the Manifest V3 service worker, content script,
  offscreen audio permission, storage permission, and web-accessible resources.
- `service_worker.js` loads shared modules and `background.js`.
- `background.js` coordinates tabs, persisted settings, built-in mappings,
  custom mappings, badge state, and audio commands.
- `offscreen.html` and `offscreen.js` host audio playback because Manifest V3
  service workers cannot own long-lived DOM or audio work.
- `track_player.js` owns Web Audio playback, crossfades, mute state, volume,
  active-track checks, and imported audio playback.
- `inject.js` runs in the Fallen London page context, detects setting/area
  changes, and renders the locator panel.
- `content.js` bridges page events and extension runtime messages.
- `extension_settings.js` contains shared defaults, including persisted settings
  and custom-audio limits.
- `extension_messages.js` contains shared message/event names.
- `extension_api.js` wraps direct extension API usage.
- `custom_audio_store.js` stores user-created area mappings and imported audio
  blobs in extension IndexedDB.

Custom mapping lookup order:

1. User-created mapping by raw Fallen London area ID.
2. Built-in area mapping from `mappings.json`.
3. Built-in setting fallback from `mappings.json`.
4. No assigned track.

The service worker can sleep and wake. On wake it reloads persisted settings and
custom mappings, rediscovers Fallen London tabs, sends current mapping/mute/
volume state, and asks the page to reannounce the current setting and area.

## Attribution

This extension's icon is by [Paomedia](https://www.iconfinder.com/paomedia) and
is used under the
[Creative Commons Attribution 3.0 Unported](http://creativecommons.org/licenses/by/3.0/)
license.

## Special Thanks

- Saltlord, a scorn fluke - for early testing and support for the idea.
- [Alan Huang](https://github.com/alanhuang122) - for providing the list of
  area IDs inside the Fallen London app.
- [Arkuzian](https://www.reddit.com/user/Arkuzian/) - for helping to debug
  issues with the original background script.
