const defaultTimeline = [
  "intro",
  "verse",
  "pre",
  "chorus",
  "verse",
  "pre",
  "chorus",
  "break",
  "bridge",
  "chorus",
  "outro"
];

const keys = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const scales = [
  "Aeolian (Natural Minor)",
  "Phrygian",
  "Dorian",
  "Harmonic Minor",
  "Locrian (spice)"
];
const tunings = [
  "Drop D (D A D G B E)",
  "Drop C (C G C F A D)",
  "Drop B (B F# B E G# C#)",
  "Drop A (A E A D F# B)"
];

export function createAnvilApp(root){
  const state = {
    preset: "Metalcore",
    key: "C#",
    scale: "Aeolian (Natural Minor)",
    bpm: 142,
    timeSig: "4/4",
    tuning: "Drop C (C G C F A D)",
    lengthMin: 2.8,
    title: "",
    seed: Math.floor(Math.random()*1e9),
    timeline: [...defaultTimeline],
    playProgress: 0,
    clipDuration: 0,
    isPlaying: false
  };

  const refs = {};
  let audioSession = null;
  let rafId = 0;

  function init(){
    root.innerHTML = renderShell();
    cacheRefs();
    wireEvents();
    refreshTitle();
    syncAll();
  }

  function renderShell(){
    return `
      <div class="app-shell">
        <header>
          <div class="inner">
            <div class="logo">
              <div class="logo-icon">⚒</div>
              <div class="logo-text">
                <strong>ANVIL</strong>
                <span>Metal Songsmith</span>
              </div>
            </div>
            <div class="header-actions">
              <button class="secondary" data-action="export-clip">Export 30s</button>
              <button class="primary" data-action="export-full">Export Full</button>
            </div>
          </div>
        </header>
        <main>
          <div class="layout">
            <div class="section-stack">
              <div class="card" id="generate-card">
                <h3>Generate & Preview</h3>
                <div class="field-grid">
                  <label class="field">
                    <span>Title</span>
                    <input data-ref="title" placeholder="Generate a title" />
                  </label>
                  <div class="field" style="align-self:flex-end;text-align:right;">
                    <button class="primary" data-action="play">Generate & Play</button>
                  </div>
                </div>
                <div class="playback-bar">
                  <div class="progress-shell">
                    <div class="progress-fill" data-ref="progress-fill"></div>
                  </div>
                  <div class="progress-time" data-ref="progress-text">0:00 / 0:00</div>
                </div>
              </div>

              <div class="card" id="timeline-card">
                <h3>Song Timeline</h3>
                <div class="timeline-list" data-ref="timeline"></div>
                <div class="timeline-actions">
                  <select data-ref="timeline-add">
                    <option value="" disabled selected>Add section…</option>
                    <option value="intro">Intro</option>
                    <option value="verse">Verse</option>
                    <option value="pre">Pre-Chorus</option>
                    <option value="chorus">Chorus</option>
                    <option value="break">Breakdown</option>
                    <option value="bridge">Bridge</option>
                    <option value="outro">Outro</option>
                  </select>
                  <button class="ghost" data-action="reset-timeline">Reset</button>
                </div>
              </div>
            </div>

            <div class="section-stack">
              <div class="card">
                <h3>Session</h3>
                <div class="field-grid">
                  ${selectField("Preset", "preset", ["Metalcore","Djent","Nu-Metal","Alt-Prog"])}
                  ${selectField("Key", "key", keys)}
                  ${selectField("Scale", "scale", scales)}
                  ${selectField("Time Sig", "timeSig", ["4/4","3/4","6/8","7/8","5/4"])}
                  ${selectField("Tuning", "tuning", tunings)}
                  ${sliderField("BPM", "bpm", 70, 210, 1)}
                  ${sliderField("Length (min)", "length", 2, 5, 0.1)}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  function selectField(label, id, options){
    return `
      <label class="field">
        <span>${label}</span>
        <select data-ref="${id}">
          ${options.map(o=>`<option value="${o}">${o}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function sliderField(label, id, min, max, step){
    return `
      <label class="field slider-field">
        <div class="slider-meta"><span>${label}</span><span data-ref="${id}-value">0</span></div>
        <input type="range" min="${min}" max="${max}" step="${step}" data-ref="${id}-slider" />
      </label>
    `;
  }

  function cacheRefs(){
    refs.titleInput = root.querySelector('[data-ref="title"]');
    refs.playButton = root.querySelector('[data-action="play"]');
    refs.progressFill = root.querySelector('[data-ref="progress-fill"]');
    refs.progressText = root.querySelector('[data-ref="progress-text"]');
    refs.timelineList = root.querySelector('[data-ref="timeline"]');
    refs.timelineAdd = root.querySelector('[data-ref="timeline-add"]');
    refs.preset = root.querySelector('[data-ref="preset"]');
    refs.key = root.querySelector('[data-ref="key"]');
    refs.scale = root.querySelector('[data-ref="scale"]');
    refs.timeSig = root.querySelector('[data-ref="timeSig"]');
    refs.tuning = root.querySelector('[data-ref="tuning"]');
    refs.bpmSlider = root.querySelector('[data-ref="bpm-slider"]');
    refs.bpmValue = root.querySelector('[data-ref="bpm-value"]');
    refs.lengthSlider = root.querySelector('[data-ref="length-slider"]');
    refs.lengthValue = root.querySelector('[data-ref="length-value"]');
    refs.exportClip = root.querySelector('[data-action="export-clip"]');
    refs.exportFull = root.querySelector('[data-action="export-full"]');
    refs.resetTimeline = root.querySelector('[data-action="reset-timeline"]');
  }

  function wireEvents(){
    refs.titleInput.addEventListener('input', (e)=>{
      state.title = e.target.value;
    });
    refs.playButton.addEventListener('click', ()=>{
      if (audioSession) {
        stopPlayback();
      } else {
        play();
      }
    });
    refs.exportClip.addEventListener('click', exportClip);
    refs.exportFull.addEventListener('click', exportFull);
    refs.resetTimeline.addEventListener('click', ()=>{
      state.timeline = [...defaultTimeline];
      renderTimeline();
    });
    refs.timelineAdd.addEventListener('change', (e)=>{
      const value = e.target.value;
      if (value) {
        state.timeline.push(value);
        renderTimeline();
      }
      refs.timelineAdd.value = "";
      refs.timelineAdd.selectedIndex = 0;
    });
    refs.preset.addEventListener('change', (e)=>{
      state.preset = e.target.value;
      refreshTitle();
    });
    refs.key.addEventListener('change', (e)=> state.key = e.target.value);
    refs.scale.addEventListener('change', (e)=> state.scale = e.target.value);
    refs.timeSig.addEventListener('change', (e)=> state.timeSig = e.target.value);
    refs.tuning.addEventListener('change', (e)=> state.tuning = e.target.value);
    refs.bpmSlider.addEventListener('input', (e)=>{
      state.bpm = Number(e.target.value);
      syncSliders();
    });
    refs.lengthSlider.addEventListener('input', (e)=>{
      state.lengthMin = Number(e.target.value);
      syncSliders();
    });
  }

  function refreshTitle(){
    const rng = seededRandom(state.seed + (state.preset.length||0));
    state.title = genTitle(rng, state.preset, influenceProfile(state.preset));
    refs.titleInput.value = state.title;
  }

  function syncAll(){
    refs.titleInput.value = state.title;
    refs.preset.value = state.preset;
    refs.key.value = state.key;
    refs.scale.value = state.scale;
    refs.timeSig.value = state.timeSig;
    refs.tuning.value = state.tuning;
    refs.bpmSlider.value = state.bpm;
    refs.lengthSlider.value = state.lengthMin;
    renderTimeline();
    syncSliders();
    updatePlayButton();
    updateProgressUI();
  }

  function syncSliders(){
    refs.bpmValue.textContent = `${state.bpm} bpm`;
    refs.lengthValue.textContent = `${state.lengthMin.toFixed(1)} min`;
  }

  function renderTimeline(){
    const map = {
      intro: "Intro",
      verse: "Verse",
      pre: "Pre-Chorus",
      chorus: "Chorus",
      break: "Breakdown",
      bridge: "Bridge",
      outro: "Outro"
    };
    refs.timelineList.innerHTML = '';
    state.timeline.forEach((section, index)=>{
      const chip = document.createElement('div');
      chip.className = 'timeline-chip';
      chip.draggable = true;
      chip.dataset.index = index;
      const label = document.createElement('span');
      label.textContent = map[section] || section;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.addEventListener('click', ()=>{
        state.timeline.splice(index,1);
        renderTimeline();
      });
      chip.addEventListener('dragstart', (e)=>{
        e.dataTransfer.setData('text/plain', String(index));
      });
      chip.addEventListener('dragover', (e)=> e.preventDefault());
      chip.addEventListener('drop', (e)=>{
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(from) && from !== index){
          const tmp = state.timeline[index];
          state.timeline[index] = state.timeline[from];
          state.timeline[from] = tmp;
          renderTimeline();
        }
      });
      chip.appendChild(label);
      chip.appendChild(remove);
      refs.timelineList.appendChild(chip);
    });
  }

  function updatePlayButton(){
    if (state.isPlaying){
      refs.playButton.textContent = 'Stop';
      refs.playButton.classList.remove('primary');
      refs.playButton.classList.add('ghost');
    } else {
      refs.playButton.textContent = 'Generate & Play';
      refs.playButton.classList.add('primary');
      refs.playButton.classList.remove('ghost');
    }
  }

  function updateProgressUI(){
    const max = state.clipDuration || 1;
    const pct = Math.min(1, (max ? state.playProgress / max : 0));
    refs.progressFill.style.width = `${(pct*100).toFixed(1)}%`;
    refs.progressText.textContent = `${fmtTime(state.playProgress)} / ${fmtTime(state.clipDuration || 0)}`;
  }

  function startRaf(duration){
    const start = performance.now()/1000;
    const tick = ()=>{
      const elapsed = performance.now()/1000 - start;
      state.playProgress = Math.min(duration, elapsed);
      updateProgressUI();
      if (elapsed < duration && audioSession){
        rafId = requestAnimationFrame(tick);
      } else {
        stopPlayback();
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback(){
    if (!audioSession){
      state.isPlaying = false;
      state.playProgress = 0;
      updatePlayButton();
      updateProgressUI();
      return;
    }
    try {
      const { ctx, out } = audioSession;
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0.0001, t+0.06);
      setTimeout(()=>{
        try { ctx.close(); } catch (err) {
          console.warn(err);
        }
        audioSession = null;
      }, 80);
    } finally {
      cancelAnimationFrame(rafId);
      rafId = 0;
      audioSession = null;
      state.isPlaying = false;
      state.playProgress = 0;
      updatePlayButton();
      updateProgressUI();
    }
  }

  function ensureResume(ctx){
    if (ctx.state === 'suspended' && ctx.resume){
      ctx.resume().catch(()=>{});
    }
  }

  function play(){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx){
      alert('Web Audio API is not supported in this browser.');
      return;
    }
    const ctx = new Ctx();
    ensureResume(ctx);
    const out = ctx.createGain();
    out.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 22;
    comp.ratio.value = 10;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    out.connect(comp);
    comp.connect(ctx.destination);
    const prof = influenceProfile(state.preset);
    const grid = makeGridFromTimeline({
      timeline: state.timeline,
      bpm: state.bpm,
      timeSig: state.timeSig,
      preset: state.preset,
      prof,
      rng: seededRandom(state.seed),
      targetMin: state.lengthMin
    });
    const t0 = ctx.currentTime + 0.08;
    const noise = createNoiseBuffer(ctx);
    const lowFreq = lowStringFreqFromTuning(state.tuning);
    const scaleNotes = buildScale(state.key, state.scale);
    const dur = stepsToSeconds(grid.steps.length, state.bpm);
    scheduleBackgroundLayer(ctx, out, t0, dur, scaleNotes);
    for (let i=0;i<grid.steps.length;i++){
      const t = t0 + stepsToSeconds(i, state.bpm);
      if (grid.kick[i]) playKick(ctx, t, out);
      if (grid.snare[i]) playSnare(ctx, t, out, noise);
      if (grid.hat[i]) playHat(ctx, t, out);
      if (grid.chug[i]) playChug(ctx, t, out, lowFreq);
      const ld = grid.lead[i];
      if (ld >= 0) playLead(ctx, t, out, freqFromNote(scaleNotes[ld % scaleNotes.length], 4));
    }
    audioSession = { ctx, out };
    state.isPlaying = true;
    state.clipDuration = dur;
    state.playProgress = 0;
    updatePlayButton();
    updateProgressUI();
    startRaf(dur);
  }

  async function exportClip(){
    const prof = influenceProfile(state.preset);
    const grid = makeSongGrid({ bars: 16, bpm: state.bpm, prof, rng: seededRandom(state.seed) });
    await renderAndDownload(grid, `${slug(state.title||'anvil')}-30s.wav`);
  }

  async function exportFull(){
    const prof = influenceProfile(state.preset);
    const grid = makeGridFromTimeline({
      timeline: state.timeline,
      bpm: state.bpm,
      timeSig: state.timeSig,
      preset: state.preset,
      prof,
      rng: seededRandom(state.seed),
      targetMin: state.lengthMin
    });
    await renderAndDownload(grid, `${slug(state.title||'anvil')}-full.wav`);
  }

  async function renderAndDownload(grid, name){
    const sr = 48000;
    const t0 = 0.25;
    const songDur = stepsToSeconds(grid.steps.length, state.bpm);
    const bedTail = 0.5;
    const renderTail = 1.0;
    const totalTime = t0 + songDur + bedTail + renderTail;
    const frames = Math.ceil(totalTime * sr);
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx){
      alert('Offline rendering is not supported in this browser.');
      return;
    }
    const ctx = new OfflineCtx(2, frames, sr);
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -6;
    lim.knee.value = 24;
    lim.ratio.value = 20;
    lim.attack.value = 0.003;
    lim.release.value = 0.12;
    master.connect(lim);
    lim.connect(ctx.destination);
    const noise = createNoiseBuffer(ctx);
    const lowFreq = lowStringFreqFromTuning(state.tuning);
    const scaleNotes = buildScale(state.key, state.scale);
    scheduleBackgroundLayer(ctx, master, t0, songDur + bedTail, scaleNotes);
    for (let i=0;i<grid.steps.length;i++){
      const t = t0 + stepsToSeconds(i, state.bpm);
      if (grid.kick[i]) playKick(ctx, t, master);
      if (grid.snare[i]) playSnare(ctx, t, master, noise);
      if (grid.hat[i]) playHat(ctx, t, master);
      if (grid.chug[i]) playChug(ctx, t, master, lowFreq);
      const ld = grid.lead[i];
      if (ld >= 0) playLead(ctx, t, master, freqFromNote(scaleNotes[ld % scaleNotes.length], 4));
    }
    const rendered = await ctx.startRendering();
    const wav = bufferToWave(rendered);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(wav);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  init();
  return { stop: stopPlayback };
}

function influenceProfile(preset){
  const base = { rapEnergy: 0.2, anthem: 0.25, ambient: 0.2, djent: 0.35 };
  if (preset === 'Djent') base.djent = 0.45;
  if (preset === 'Nu-Metal') base.rapEnergy = 0.45;
  if (preset === 'Alt-Prog') base.ambient = 0.35;
  return base;
}

function genTitle(rng, preset){
  const moods = ['Obsidian', 'Crimson', 'Void', 'Neon', 'Frozen', 'Celestial', 'Apex'];
  const nouns = ['Requiem', 'Hammer', 'Pulse', 'Signal', 'Eclipse', 'Rift', 'Relic'];
  const twists = ['of '+preset, 'Protocol', 'Uprising', 'Sequence', 'Doctrine', 'Bloom'];
  const mood = moods[Math.floor(rng()*moods.length)];
  const noun = nouns[Math.floor(rng()*nouns.length)];
  const twist = twists[Math.floor(rng()*twists.length)];
  return `${mood} ${noun} ${twist}`;
}

function fmtTime(sec){
  if (!sec) return '0:00';
  const minutes = Math.floor(sec/60);
  const seconds = Math.floor(sec%60).toString().padStart(2,'0');
  return `${minutes}:${seconds}`;
}

function stepsPerBar(){ return 16; }
function beatSeconds(bpm){ return 60/Math.max(40, Math.min(260, bpm||120)); }
function stepsToSeconds(steps, bpm){ return (steps/4) * beatSeconds(bpm); }
function beatsPerBarFromTimeSig(ts){ const m = /^(\d+)\/(\d+)$/.exec(ts||'4/4'); const num = m? parseInt(m[1],10):4; return num||4; }
function barsForSeconds(bpm, seconds, ts){ const spb = beatsPerBarFromTimeSig(ts||'4/4')*beatSeconds(bpm); return Math.max(1, Math.ceil(seconds / spb)); }
function buildScale(root, name){ const notes = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"]; const idx = notes.indexOf(root); const modes = { "Aeolian (Natural Minor)": [2,1,2,2,1,2,2], "Phrygian": [1,2,2,2,1,2,2], "Dorian": [2,1,2,2,2,1,2], "Harmonic Minor": [2,1,2,2,1,3,1], "Locrian (spice)": [1,2,2,1,2,2,2] }; const steps = modes[name] || modes["Aeolian (Natural Minor)"]; const scale = [root]; let i = idx; for (const s of steps){ i=(i+s)%notes.length; scale.push(notes[i]); } return scale.slice(0,7); }
function degreeToNote(scale, deg){ const i = ((deg-1)%scale.length+scale.length)%scale.length; return scale[i]; }
function lowStringFreqFromTuning(tuning){ const base = String(tuning||'Drop C').slice(5,6); const map = { 'D': 73.416, 'C': 65.406, 'B': 61.735, 'A': 55.000 }; return map[base] || 65.406; }
function noteToSemitone(n){ const map = { C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11 }; return map[n]; }
function freqFromNote(n, octave){ const semi = noteToSemitone(n); const midi = (octave+1)*12 + semi; return 440*Math.pow(2, (midi-69)/12); }

function makeSongGrid({ bars, bpm, prof, rng }){ const steps = bars * stepsPerBar(); const kick = Array(steps).fill(0), snare = Array(steps).fill(0), hat = Array(steps).fill(0), chug = Array(steps).fill(0), lead = Array(steps).fill(-1); const role = (b)=> (b<4? 'verse' : b<8? 'pre' : b<12? 'chorus' : 'break'); for (let b=0;b<bars;b++){ const base=b*16; applyRolePatterns({ role: role(b), base, kick, snare, hat, chug, lead, prof, rng }); } return { steps: Array.from({length: steps}, (_,i)=>i), kick, snare, hat, chug, lead }; }
function makeGridFromTimeline({ timeline, bpm, timeSig, preset, prof, rng, targetMin }){ const defaults = { intro:2, verse:8, pre:4, chorus:8, break:8, bridge:4, outro:2 }; let bars = timeline.map(s=> defaults[s] || 4); if (targetMin){ const secPerBar = beatsPerBarFromTimeSig(timeSig||'4/4')*beatSeconds(bpm); const targetBars = Math.max(8, Math.round((targetMin*60)/secPerBar)); const sum = bars.reduce((a,b)=>a+b,0); const scale = targetBars / Math.max(1,sum); bars = bars.map(b=> Math.max(1, Math.round(b*scale))); } const grids = timeline.map((role, i)=> makeSongGridWithRole({ role, bars: bars[i], bpm, prof, rng }) ); return concatGrids(grids); }
function makeSongGridWithRole({ role, bars, bpm, prof, rng }){ const steps = bars * stepsPerBar(); const kick = Array(steps).fill(0), snare = Array(steps).fill(0), hat = Array(steps).fill(0), chug = Array(steps).fill(0), lead = Array(steps).fill(-1); for (let b=0;b<bars;b++){ const base=b*16; applyRolePatterns({ role, base, kick, snare, hat, chug, lead, prof, rng }); } return { steps: Array.from({length: steps}, (_,i)=>i), kick, snare, hat, chug, lead }; }
function applyRolePatterns({ role, base, kick, snare, hat, chug, lead, prof, rng }){ const k = role==='chorus' ? [0,6,8,14] : role==='break' ? [0,2,4,6,8,10,12,14] : role==='pre' ? [0,8,12] : [0,8,11]; const s = [4,12]; const hatsDense = role==='chorus' || prof.anthem>0.3; for (const i of k) kick[base+i] = 1; for (const i of s) snare[base+i] = 1; for (let i=0;i<16;i++){ hat[base+i] = (i%2===0 || (hatsDense && i%1===0)) ? 1 : (rng()<0.2? 1: 0); } const dj = prof.djent>0.3 ? [3,7,11,15] : []; const baseAcc = [0,4,8,12]; const hits = [...baseAcc, ...dj]; for (const i of hits) chug[base+i] = 1; for (let i=0;i<16;i++) if (rng()<0.05) chug[base+i] = 1; if (role==='chorus'){ const motif = [1,5,6,5,4,3]; const places = [0,2,4,6,8,10]; for (let j=0;j<places.length;j++) lead[base+places[j]] = motif[j%motif.length]-1; } }
function concatGrids(grids){ const totalSteps = grids.reduce((s,g)=> s + g.steps.length, 0); const kick = Array(totalSteps).fill(0), snare=Array(totalSteps).fill(0), hat=Array(totalSteps).fill(0), chug=Array(totalSteps).fill(0), lead=Array(totalSteps).fill(-1); let offset=0; for (const g of grids){ for (let i=0;i<g.steps.length;i++){ kick[offset+i]=g.kick[i]; snare[offset+i]=g.snare[i]; hat[offset+i]=g.hat[i]; chug[offset+i]=g.chug[i]; lead[offset+i]=g.lead[i]; } offset+=g.steps.length; } return { steps: Array.from({length: totalSteps}, (_,i)=>i), kick, snare, hat, chug, lead }; }

function createNoiseBuffer(ctx){ const buffer = ctx.createBuffer(1, ctx.sampleRate*1, ctx.sampleRate); const data = buffer.getChannelData(0); for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*0.6; return buffer; }
function makeDistortionCurve(amount=120){ const k = typeof amount === 'number' ? amount : 50; const n = 44100; const curve = new Float32Array(n); const deg = Math.PI / 180; for (let i=0; i<n; ++i){ const x = i*2/n - 1; curve[i] = (3+k)*x*20*deg / (Math.PI + k*Math.abs(x)); } return curve; }
function playKick(ctx, time, dest){ const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(130, time); osc.frequency.exponentialRampToValueAtTime(45, time+0.15); gain.gain.setValueAtTime(1.0, time); gain.gain.exponentialRampToValueAtTime(0.001, time+0.22); osc.connect(gain).connect(dest); osc.start(time); osc.stop(time+0.25); return osc; }
function playSnare(ctx, time, dest, noiseBuffer){ const src = ctx.createBufferSource(); src.buffer = noiseBuffer; const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 1800; const gain = ctx.createGain(); gain.gain.setValueAtTime(0.9, time); gain.gain.exponentialRampToValueAtTime(0.0001, time+0.15); src.connect(hp).connect(gain).connect(dest); src.start(time); src.stop(time+0.2); return src; }
function playHat(ctx, time, dest){ const len = 0.06; const noise = ctx.createBufferSource(); noise.buffer = createNoiseBuffer(ctx); const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 6000; const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, time); gain.gain.exponentialRampToValueAtTime(0.001, time+len); noise.connect(hp).connect(gain).connect(dest); noise.start(time); noise.stop(time+len+0.01); return noise; }
function playChug(ctx, time, dest, freq){ const osc = ctx.createOscillator(); osc.type='sawtooth'; osc.frequency.setValueAtTime(freq, time); const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(0.6, time+0.005); gain.gain.exponentialRampToValueAtTime(0.0001, time+0.09); const shaper = ctx.createWaveShaper(); shaper.curve = makeDistortionCurve(180); const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.6; osc.connect(shaper).connect(lp).connect(gain).connect(dest); osc.start(time); osc.stop(time+0.12); return osc; }
function playLead(ctx, time, dest, freq){ const osc = ctx.createOscillator(); osc.type='triangle'; osc.frequency.setValueAtTime(freq, time); const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(0.5, time+0.02); gain.gain.exponentialRampToValueAtTime(0.0001, time+0.3); const delay = ctx.createDelay(0.5); delay.delayTime.value = 0.22; const fb = ctx.createGain(); fb.gain.value = 0.25; delay.connect(fb).connect(delay); osc.connect(gain).connect(dest); osc.connect(delay).connect(dest); osc.start(time); osc.stop(time+0.32); return osc; }

function scheduleBackgroundLayer(ctx, dest, t0, duration, scaleNotes){ const chord = [degreeToNote(scaleNotes,1), degreeToNote(scaleNotes,5), degreeToNote(scaleNotes,6)]; const freqs = chord.map(n=>freqFromNote(n, 3)); for (let i=0;i<freqs.length;i++){ const f = freqs[i]; const osc = ctx.createOscillator(); osc.type='sawtooth'; osc.frequency.setValueAtTime(f, t0); const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) pan.pan.value = i===0? -0.6 : i===2? 0.6 : 0; const lpf = ctx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value = 900; lpf.Q.value = 0.3; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.22, t0+0.4); g.gain.linearRampToValueAtTime(0.18, t0+duration-0.3); g.gain.linearRampToValueAtTime(0.0001, t0+duration); const delay = ctx.createDelay(0.6); delay.delayTime.value = 0.27 + 0.03*i; const fb = ctx.createGain(); fb.gain.value = 0.2; delay.connect(fb).connect(delay); if (pan) { osc.connect(lpf).connect(g).connect(pan).connect(dest); } else { osc.connect(lpf).connect(g).connect(dest); } osc.connect(delay).connect(dest); osc.start(t0); osc.stop(t0+duration); } }

function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function bufferToWave(buffer){ const numOfChan = buffer.numberOfChannels, length = buffer.length * numOfChan * 2 + 44; const ab = new ArrayBuffer(length); const view = new DataView(ab); const channels = []; for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i)); let offset = 0; let pos = 0; const setUint16 = (d)=>{ view.setUint16(pos, d, true); pos += 2; }; const setUint32 = (d)=>{ view.setUint32(pos, d, true); pos += 4; }; setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan); setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * numOfChan * 2); setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4); while (pos < length) { for (let i = 0; i < numOfChan; i++) { const sample = Math.max(-1, Math.min(1, channels[i][offset] || 0)); view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); pos += 2; } offset++; } return new Blob([view], { type: 'audio/wav' }); }
function seededRandom(seed){ let t=(seed>>>0)+0x6D2B79F5; return function(){ t|=0; t=(t+0x6D2B79F5)|0; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
