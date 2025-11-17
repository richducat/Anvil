# Anvil – Metal Songsmith

A single-page Web Audio demo that mirrors the functionality of Producer.ai's AI metal generator. Everything runs client-side without external services—simply open `index.html` in a modern browser to riff, preview, and export heavy tracks.

## Features
- Interactive timeline editor with drag and drop sections.
- Session controls for preset, key, scale, BPM, time signature, tuning, and clip length.
- Procedural title generator tied to the current preset.
- Real-time preview using the Web Audio API.
- Offline rendering to downloadable WAV files (30-second teaser or full arrangement).

## Development
No build tooling is required. If you prefer a local server for autoplay permissions, run something like:

```bash
python -m http.server 4173
```

Then visit [http://localhost:4173](http://localhost:4173) and open the app.

## Live deployment

A GitHub Pages workflow (`.github/workflows/deploy.yml`) publishes the static site on every push to `main` (and via manual dispatch). If you're testing from a fork, enable Pages in the repo settings and trigger the workflow to get a live URL for review.
