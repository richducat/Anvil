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

A Vercel deployment workflow (`.github/workflows/deploy.yml`) builds and publishes the static site on every push to `main` (and via manual dispatch). To enable it:

1. Create a Vercel project that points at this repository's root (no build step is required).
2. Add the following repository secrets so the workflow can deploy: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN`.
3. Push to `main` or run the workflow manually to produce the production URL in the job output.
