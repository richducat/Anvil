# Anvil — Metal Songsmith

**A zero-dependency, client-side metal-track generator built on the Web Audio API.** Arrange a song on a drag-and-drop timeline, procedurally generate riffs and drums from a seed, preview in real time, and export a finished WAV — all in the browser, no server, no build step, no samples.

**▶ Live demo: [richducat.github.io/Anvil](https://richducat.github.io/Anvil/)**

## Features

- **Timeline editor** — arrange intro / verse / pre-chorus / chorus / breakdown / bridge / outro sections as chips; drag to reorder, add or remove sections, or reset to the default arrangement.
- **Session controls** — preset (Metalcore, Djent, Nu-Metal, Alt-Prog), key (all 12), scale (Aeolian, Phrygian, Dorian, Harmonic Minor, Locrian), time signature (4/4, 3/4, 6/8, 7/8, 5/4), guitar tuning (Drop D / C / B / A), BPM (70–210), and target song length (2–5 min).
- **Procedural riffs and drums** — a seeded PRNG generates per-section kick, snare, hi-hat, chug, and lead patterns; each preset shifts the generator's "influence profile" (e.g. Djent adds syncopated off-beat chugs, choruses get a lead motif and denser cymbals).
- **Fully synthesized sounds** — every instrument is built from oscillators and noise at runtime: pitch-dropping sine kick, filtered-noise snare and hats, distorted sawtooth chugs tuned to your drop tuning's low string, delayed triangle lead, and a stereo pad bed. No audio files anywhere in the repo.
- **Real-time preview** — one click builds the whole arrangement and plays it through a compressor-limited master bus, with a live progress bar.
- **WAV export** — renders offline (stereo, 48 kHz, 16-bit PCM) and downloads either a ~30-second teaser (16 bars) or the full arrangement.
- **Procedural song titles** — because every track deserves a name like *Obsidian Requiem Protocol*.
- **Zero dependencies** — plain ES-module JavaScript, one HTML file, one stylesheet. The only external resource is a Google Fonts link.

## How it works

**Procedural generation.** A deterministic seeded PRNG (Mulberry32-style) drives all randomness, so a given seed always produces the same song. Each timeline section maps to a bar count, scaled so the whole arrangement hits your target length at the chosen BPM and time signature. A per-section pattern writer fills a 16-steps-per-bar grid for five voices (kick, snare, hat, chug, lead), with rules keyed to the section's role — breakdowns get wall-to-wall kicks, choruses get a melodic lead motif — and nudged by the preset's influence profile. Scales are built from interval tables, and lead notes are drawn from the resulting mode.

**Web Audio graph.** Playback schedules every grid hit ahead of time on a single `AudioContext`. Each voice is synthesized from primitives:

- Kick: sine oscillator with an exponential 130 Hz → 45 Hz pitch drop
- Snare / hats: white-noise buffers through highpass filters with sharp envelopes
- Chugs: sawtooth → `WaveShaper` distortion curve → lowpass, with the oscillator tuned to the low string of your selected drop tuning
- Lead: triangle oscillator with a feedback delay line
- Pad bed: three detuned, stereo-panned sawtooth voices on scale degrees 1/5/6 through lowpass filters

Everything sums into a master gain feeding a `DynamicsCompressor` configured as a limiter.

**WAV export.** The same graph is rebuilt inside an `OfflineAudioContext` (2 channels, 48 kHz), rendered with `startRendering()`, then hand-encoded to a 16-bit PCM WAV — RIFF header written byte-by-byte with a `DataView` — and downloaded as a Blob. No encoder library needed.

## Quick start

Easiest: just use the [live demo](https://richducat.github.io/Anvil/).

To run locally, serve the folder with any static file server (ES modules don't load over `file://` in most browsers):

```bash
git clone https://github.com/richducat/Anvil.git
cd Anvil
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173). There is nothing to install and no build step.

## Project structure

```
index.html        # entry point
src/main.js       # bootstraps the app
src/app.js        # the whole app: UI, generator, synth engine, WAV encoder
src/styles.css    # styling
```

## Contributing

Contributions are welcome — new presets, better drum patterns, more scales and tunings, smarter riff generation, or synth improvements are all fair game. Open an issue or send a pull request. The entire engine lives in one dependency-free file (`src/app.js`), so it's an easy codebase to jump into.

## License

MIT — see [LICENSE](LICENSE).

Built by Richard Ducat ([eb28.co](https://eb28.co))
