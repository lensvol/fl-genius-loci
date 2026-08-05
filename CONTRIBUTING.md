# Contributing

FL Genius Loci: SEEKER is a maintained continuation of the original FL Genius
Loci extension. Contributions should preserve the original extension's behavior
unless a change is explicitly part of a documented fix or feature.

## How the extension works

- `inject.js` detects Fallen London setting and area changes in the page.
- `content.js` relays page events to the extension runtime and sends extension
  updates back to the page.
- `background.js` coordinates tabs, persisted settings, built-in mappings,
  custom mappings, badge state, and audio commands.
- `offscreen.html` and `offscreen.js` host audio playback for Manifest V3.
- `track_player.js` loads and plays built-in tracks from `tracks/` and imported
  custom audio from extension storage.
- `custom_audio_store.js` stores user-created mappings and imported audio blobs
  in extension IndexedDB.

## Mapping notes

- `areas` maps Fallen London area IDs to logical location names.
- `settings` maps Fallen London setting IDs to logical location names.
- `tracks` maps those logical location names to bundled audio filenames.
- User-created custom mappings are stored separately and must not modify the
  bundled `mappings.json` file automatically.

## Safe workflow

1. Make one focused change at a time.
2. Keep every intermediate build loadable as an unpacked extension.
3. Run JavaScript syntax checks and JSON parse checks.
4. Reload the unpacked extension.
5. Test in Fallen London, including service-worker wake behavior when relevant.
6. Keep the original author's license, attribution, and credits intact.
