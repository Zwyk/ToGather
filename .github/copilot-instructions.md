# Copilot Instructions for ToGather

## Project Overview
ToGather is a web-based tool for planning meetups between two people, optimizing the meeting point and travel routes using Google Maps. The app is a single-page HTML+JS application with all logic in `index.html` and API key configuration in `config.js`.

## Architecture & Data Flow
- **Frontend only**: No backend/server code; all logic runs in the browser.
- **Key files**:
  - `index.html`: Contains UI, main logic, and Google Maps integration.
  - `config.js`: Stores the Google Maps API key as `window.GOOGLE_MAPS_API_KEY`.
- **Google Maps API**: Uses the beta channel with Places and Marker libraries. All routing, autocomplete, and map rendering are handled via Google Maps JS API.
- **User Flow**:
  1. Users enter two addresses and travel modes.
  2. Optionally set a meeting point (by address or clicking the map).
  3. Optionally set a final destination.
  4. App calculates and displays routes, durations, and comparisons.
  5. "Optimize meeting point" samples candidate points along possible routes and selects the fairest/fastest meeting location.

## Developer Workflows
- **No build step**: Directly open `index.html` in a browser to run.
- **Debugging**: Use browser DevTools (console, network, sources) for JS debugging.
- **API key**: Set in `config.js`. Do not commit sensitive keys to public repos.
- **Testing**: Manual, via browser interaction. No automated tests or test framework present.

## Project-Specific Patterns
- **All logic in one file**: Main JS code is embedded in `<script>` tags in `index.html`.
- **Google Maps integration**: Loads API dynamically using the key from `config.js`. Uses advanced widgets (`gmp-place-autocomplete`, `AdvancedMarkerElement`).
- **Routing and optimization**: Uses custom logic to sample candidate meeting points and evaluate fairness/total travel time.
- **Error handling**: User-facing errors are shown in the `#error` span; console errors for debugging.
- **UI conventions**: Uses flexbox for controls, color-coded routes, and inline hints for user actions.

## External Dependencies
- **Google Maps JS API**: Beta channel, with `places` and `marker` libraries.
- **No other libraries**: No npm, no package manager, no build tools.

## Examples
- To add a new travel mode, update the `SPEEDS_KMH` object and `<select>` options in `index.html`.
- To change the map's default center, edit the `center` property in `initMap()`.

## Recommendations for AI Agents
- Focus on editing `index.html` for logic/UI changes; use `config.js` only for API key management.
- Preserve the dynamic loading pattern for Google Maps API.
- Maintain the single-file structure unless refactoring is explicitly requested.
- Document any new developer workflows or conventions in this file for future agents.

---
_Last updated: 2025-11-20_
