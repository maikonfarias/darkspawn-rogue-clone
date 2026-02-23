// ============================================================
//  ProceduralMusic — Diablo 1-inspired dark dungeon ambiance
//  Pure Web Audio API synthesis — no audio files required
//
//  Architecture:
//    Drone layer   → detuned sawtooth oscillators in D minor
//    Chord pads    → organ-like sine harmonics, slow chords
//    Melody layer  → plucked string synthesis, minor-scale motifs
//    Reverb        → multi-tap feedback delay network
//
//  Themes:
//    'menu'    — hauntingly sparse, Tristram-like
//    'shallow' — cathedral gothic (floors 1-3)
//    'mid'     — underground oppressive (floors 4-7)
//    'deep'    — hellish, dissonant (floors 8-10)
// ============================================================

// ── Note utilities ─────────────────────────────────────────
function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// D natural minor scale intervals (semitones from root)
const D_MINOR = [0, 2, 3, 5, 7, 8, 10];

// Each theme: rootMidi = D3 (50) unless stated
const THEMES = {
  menu:    { rootMidi: 50, bpm: 58, darkLevel: 0.25, droneVol: 0.14, padVol: 0.13, melodyVol: 0.18 },
  shallow: { rootMidi: 50, bpm: 55, darkLevel: 0.45, droneVol: 0.18, padVol: 0.14, melodyVol: 0.15 },
  mid:     { rootMidi: 50, bpm: 50, darkLevel: 0.70, droneVol: 0.22, padVol: 0.14, melodyVol: 0.11 },
  deep:    { rootMidi: 49, bpm: 44, darkLevel: 1.00, droneVol: 0.26, padVol: 0.13, melodyVol: 0.08 },
};

// Chord progressions as semitone offsets from rootMidi (voiced for D minor)
// [bass, mid, top]
const CHORD_SETS = [
  // Dm  →  Bb  →  F  →  Am
  [ [0, 3, 7],  [-2, 3, 6],  [-7, -4, 0],  [-3, 0, 4]  ],
  // Dm  →  Gm  →  Am  →  F
  [ [0, 3, 7],  [-5, -2, 2], [-3, 0, 4],   [-7, -4, 0] ],
  // Dm  →  C   →  Bb  →  Am (darker)
  [ [0, 3, 7],  [-2, 2, 5],  [-2, 3, 6],   [-3, 0, 4]  ],
];

// Melodic motifs — semitone offsets from rootMidi (played at rootMidi octave)
const MOTIFS = [
  // Tristram-esque: D C A Bb G F E D
  [0, -2, -3, -4, -5, -7, -9, 0],
  // Ascending lament: D F G A C D
  [0, 3, 5, 7, 10, 12],
  // Descending: C A G F D
  [10, 7, 5, 3, 0],
  // Short phrase: D F E D
  [0, 3, 2, 0],
  // D Bb A G F E D
  [0, -2, -3, -5, -7, -9, -12],
];

// ── Main engine ────────────────────────────────────────────
class ProceduralMusicEngine {
  constructor() {
    this._ctx      = null;
    this._master   = null;
    this._dryBus   = null;
    this._wetBus   = null;
    this._nodes    = [];
    this._timers   = [];
    this._playing  = false;
    this._volume   = 0.52;
    this._theme    = null;
  }

  get isPlaying() { return this._playing; }

  /** Suspend the AudioContext (e.g. tab hidden). */
  suspend() {
    if (this._ctx && this._ctx.state === 'running') this._ctx.suspend().catch(() => {});
  }

  /** Resume the AudioContext (e.g. tab visible again). */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
  }

  // ── Public API ──────────────────────────────────────────

  /**
   * Start music with the given theme key.
   * Safe to call even if already playing (stops first).
   */
  play(themeKey = 'menu') {
    if (this._playing) this._stopImmediate();

    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[Music] Web Audio API not available:', e);
      return;
    }

    this._ctx    = ctx;
    this._nodes  = [];
    this._timers = [];

    // Master volume with fade-in
    this._master = ctx.createGain();
    this._master.gain.setValueAtTime(0, ctx.currentTime);
    this._master.gain.linearRampToValueAtTime(this._volume, ctx.currentTime + 4.0);
    this._master.connect(ctx.destination);

    // Dry / wet buses for reverb mix
    this._dryBus = this._mkGain(0.62);
    this._dryBus.connect(this._master);
    this._wetBus = this._mkGain(0.38);
    this._wetBus.connect(this._master);

    this._buildReverb();

    this._theme   = THEMES[themeKey] ?? THEMES.menu;
    this._playing = true;

    this._startDrones();
    this._startChordPads();
    this._scheduleMelody();

    // Resume if browser suspended the context (autoplay policy)
    if (ctx.state === 'suspended') {
      const resume = () => { ctx.resume(); document.removeEventListener('pointerdown', resume); };
      document.addEventListener('pointerdown', resume, { once: true });
    }
  }

  /** Fade out and stop all audio. */
  stop(fadeSec = 2.5) {
    if (!this._playing || !this._ctx) return;
    this._playing = false;

    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    const ctx    = this._ctx;
    const master = this._master;
    // Snapshot current nodes NOW so the delayed cleanup can't accidentally
    // destroy nodes belonging to a new play() call that starts before the
    // timeout fires (e.g. menu stop → game scene play within 1-2 seconds).
    const nodesToStop = this._nodes.slice();

    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeSec);

    // Clear immediately so a subsequent play() starts with a clean list
    this._nodes  = [];
    this._ctx    = null;
    this._master = null;

    setTimeout(() => {
      nodesToStop.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
      ctx.close().catch(() => {});
    }, fadeSec * 1000 + 300);
  }

  /** Crossfade to a different theme. */
  setTheme(themeKey) {
    const next = THEMES[themeKey];
    if (!next || this._theme?.label === themeKey) return;
    this.stop(3.0);
    const tid = setTimeout(() => { if (!this._playing) this.play(themeKey); }, 3600);
    // store tid in a separate list that won't be cleared by stop()
    this._pendingTheme = tid;
  }

  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this._master && this._ctx) {
      this._master.gain.setTargetAtTime(this._volume, this._ctx.currentTime, 0.4);
    }
  }

  // ── Internal helpers ────────────────────────────────────

  _stopImmediate() {
    this._playing = false;
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];
    this._nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
    this._nodes = [];
    this._ctx?.close().catch(() => {});
    this._ctx = null;
    this._master = null;
  }

  _track(node) { this._nodes.push(node); return node; }

  _mkGain(val) {
    const g = this._ctx.createGain();
    g.gain.value = val;
    this._track(g);
    return g;
  }

  _mkOsc(type, freq, detune = 0) {
    const o = this._ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    return this._track(o);
  }

  _mkFilter(type, freq, Q = 1) {
    const f = this._ctx.createBiquadFilter();
    f.type     = type;
    f.frequency.value = freq;
    f.Q.value  = Q;
    return this._track(f);
  }

  // Multi-tap feedback delay used as a cheap reverb
  _buildReverb() {
    const ctx  = this._ctx;
    const taps = [0.047, 0.093, 0.148, 0.207, 0.271];
    taps.forEach((d, i) => {
      const delay = ctx.createDelay(0.5);
      delay.delayTime.value = d;
      const fb = this._mkGain(0.18 - i * 0.02);
      delay.connect(fb);
      fb.connect(delay);
      this._wetBus.connect(delay);
      delay.connect(this._master);
      this._track(delay);
    });
  }

  // ── Drone layer ─────────────────────────────────────────

  _startDrones() {
    const ctx = this._ctx;
    const { rootMidi, darkLevel, droneVol } = this._theme;

    // Three drone oscillators: root-2oct, 5th below root-1oct, root-1oct
    const specs = [
      { freq: midiToHz(rootMidi - 24),     detune: -4,  type: 'sawtooth', vol: droneVol * 1.0 },
      { freq: midiToHz(rootMidi - 24 + 7), detune:  2,  type: 'sawtooth', vol: droneVol * 0.7 },
      { freq: midiToHz(rootMidi - 12),     detune:  5,  type: 'sine',     vol: droneVol * 0.6 },
    ];

    // Extra dissonant layer on deep floors
    if (darkLevel >= 0.9) {
      specs.push({ freq: midiToHz(rootMidi - 24 + 6), detune: 0, type: 'sawtooth', vol: droneVol * 0.4 });
    }

    specs.forEach(({ freq, detune, type, vol }, i) => {
      const lp  = this._mkFilter('lowpass', 200 + darkLevel * 180, 0.6);
      const g   = this._mkGain(vol);
      const osc = this._mkOsc(type, freq, detune);

      // Slow tremolo via LFO
      const lfo  = this._mkOsc('sine', 0.07 + i * 0.025);
      const lfoG = this._mkGain(0.025);
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      lfo.start();

      osc.connect(lp);
      lp.connect(g);
      g.connect(this._dryBus);
      osc.start();
    });
  }

  // ── Chord pad layer ─────────────────────────────────────

  _startChordPads() {
    const { rootMidi, bpm, darkLevel, padVol } = this._theme;
    const beatSec   = 60 / bpm;
    const chordBeats = 8;          // each chord lasts 8 beats
    const chordSec   = chordBeats * beatSec;

    const prog = CHORD_SETS[Math.floor(darkLevel * (CHORD_SETS.length - 0.01))];
    let chordIdx = 0;

    const playChord = () => {
      if (!this._playing) return;

      const semitones = prog[chordIdx % prog.length];
      chordIdx++;

      // For each chord note, build an organ-like tone (2 sine harmonics)
      semitones.forEach(s => {
        const freq = midiToHz(rootMidi + s);
        this._organTone(freq, padVol / semitones.length, chordSec);
      });

      const tid = setTimeout(playChord, chordSec * 1000);
      this._timers.push(tid);
    };

    playChord();
  }

  // Organ-ish tone: fundamental + 2nd harmonic with slow attack/release
  _organTone(freq, vol, durationSec) {
    if (!this._ctx || !this._playing) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const attackSec  = 1.8;
    const releaseSec = 0.8;
    const sustainSec = durationSec - attackSec - releaseSec;

    [[1.0, 0.70], [2.0, 0.30], [3.0, 0.10]].forEach(([mult, ratio]) => {
      const osc = this._mkOsc('sine', freq * mult);
      const env = this._mkGain(0.001);
      const flt = this._mkFilter('lowpass', 1400 / mult, 0.8);

      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(vol * ratio, now + attackSec);
      if (sustainSec > 0) {
        env.gain.setValueAtTime(vol * ratio, now + attackSec + sustainSec);
      }
      env.gain.linearRampToValueAtTime(0.001, now + durationSec);

      osc.connect(env);
      env.connect(flt);
      flt.connect(this._dryBus);
      flt.connect(this._wetBus);

      const stopAt = now + durationSec + 0.5;
      osc.start(now);
      osc.stop(stopAt);
    });
  }

  // ── Melody layer ────────────────────────────────────────

  _scheduleMelody() {
    const { rootMidi, melodyVol } = this._theme;

    let motifIdx = 0;
    let noteIdx  = 0;
    let motif    = MOTIFS[0];

    const tick = () => {
      if (!this._playing) return;

      if (noteIdx >= motif.length) {
        // Fixed-time silence between motifs (3–7 seconds)
        noteIdx  = 0;
        motifIdx = (motifIdx + 1) % MOTIFS.length;
        motif    = MOTIFS[motifIdx];
        const gapMs = (3 + Math.random() * 4) * 1000;
        const tid = setTimeout(tick, gapMs);
        this._timers.push(tid);
        return;
      }

      const semi = motif[noteIdx];
      const freq = midiToHz(rootMidi + semi);
      this._pluckNote(freq, melodyVol);
      noteIdx++;

      // Fixed-time note spacing: 0.9–1.9 seconds per note
      // (keeps the Tristram plucking cadence independent of BPM)
      const durMs = (0.9 + Math.random() * 1.0) * 1000;
      const tid = setTimeout(tick, durMs);
      this._timers.push(tid);
    };

    // Start melody after a 2-second intro silence
    const tid = setTimeout(tick, 2000);
    this._timers.push(tid);
  }

  // Plucked string synthesis: fast attack → long exponential decay
  _pluckNote(freq, vol = 0.15) {
    if (!this._ctx || !this._playing) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Three partials: fundamental, octave, sub-octave
    const partials = [
      { f: freq,       detune:  0, vol: 1.00, type: 'sine'     },
      { f: freq * 2,   detune:  3, vol: 0.28, type: 'sine'     },
      { f: freq * 0.5, detune: -2, vol: 0.18, type: 'triangle' },
    ];

    const mixGain = this._mkGain(vol);
    const lp      = this._mkFilter('lowpass', 2200, 1.4);
    mixGain.connect(lp);
    lp.connect(this._dryBus);
    lp.connect(this._wetBus);

    partials.forEach(({ f, detune, vol: pv, type }) => {
      const osc = this._mkOsc(type, f, detune);
      const env = this._mkGain(0.001);

      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(pv,       now + 0.018);
      env.gain.setTargetAtTime(pv * 0.20, now + 0.04,  0.4);
      env.gain.setTargetAtTime(0.001,     now + 0.5,   0.7);

      osc.connect(env);
      env.connect(mixGain);

      const stopAt = now + 4;
      osc.start(now);
      osc.stop(stopAt);
    });
  }
}

// ── Singleton export ────────────────────────────────────────
export const Music = new ProceduralMusicEngine();

/** Helper: pick the right dungeon theme based on floor number. */
export function themeForFloor(floor) {
  if (floor <= 3) return 'shallow';
  if (floor <= 7) return 'mid';
  return 'deep';
}
