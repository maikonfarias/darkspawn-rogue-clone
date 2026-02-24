// ============================================================
//  SoundEffects — Procedural SFX via Web Audio API
//  All sounds are synthesized; no audio files required.
//
//  Usage:
//    import { SFX } from './SoundEffects.js';
//    SFX.play('swing');
//    SFX.play('roar');   // has 1-second cooldown
//    SFX.muted = true;
// ============================================================

class SoundEffectsEngine {
  constructor() {
    this._muted   = false;
    this._volume  = 0.70;
    this._ctx     = null;
    this._roarCooling = false;  // 1-second cooldown flag
  }

  // ── Public API ──────────────────────────────────────────

  get muted() { return this._muted; }
  set muted(v) { this._muted = !!v; }

  get volume() { return this._volume; }
  set volume(v) { this._volume = Math.max(0, Math.min(1, v)); }

  /** Play a named sound effect. */
  play(name) {
    if (this._muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;

    switch (name) {
      case 'roar':        this._roar(ctx);      break;
      case 'roar-force':  this._roarSound(ctx); break; // bypasses cooldown
      case 'swing':       this._swing(ctx);     break;
      case 'hit':         this._hit(ctx);        break;
      case 'coin':        this._coin(ctx);       break;
      case 'equip':       this._equip(ctx);      break;
      case 'potion':      this._potion(ctx);     break;
      case 'chest':       this._chest(ctx);      break;
      case 'door':        this._door(ctx);       break;
      case 'stairs-down': this._stairs(ctx, false); break;
      case 'stairs-up':   this._stairs(ctx, true);  break;
      case 'use':         this._use(ctx);        break;
      case 'elder-heal':  this._elderHeal(ctx);  break;
      // Town Portal
      case 'townScroll':   this._sndTownScroll(ctx);  break;
      case 'portalReturn': this._sndPortalReturn(ctx); break;
      // Skills
      case 'skill-magicBolt':   this._sndMagicBolt(ctx);   break;
      case 'skill-fireball':    this._sndFireball(ctx);    break;
      case 'skill-iceNova':     this._sndIceNova(ctx);     break;
      case 'skill-arcaneShield':this._sndArcaneShield(ctx);break;
      case 'skill-berserker':   this._sndBerserker(ctx);   break;
      case 'skill-whirlwind':   this._sndWhirlwind(ctx);   break;
      case 'skill-shadowStep':  this._sndShadowStep(ctx);  break;
      case 'skill-deathMark':   this._sndDeathMark(ctx);   break;
      default: break;
    }
  }

  /** Suspend the AudioContext when the tab is hidden. */
  suspend() {
    if (this._ctx && this._ctx.state === 'running') this._ctx.suspend().catch(() => {});
  }

  /** Resume the AudioContext when the tab becomes visible. */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
  }

  // ── Internal helpers ────────────────────────────────────

  _getCtx() {
    try {
      if (!this._ctx || this._ctx.state === 'closed') {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
      return this._ctx;
    } catch (_) { return null; }
  }

  /** Master gain for a one-shot burst. Auto-disconnects after durationSec. */
  _master(ctx, vol, durationSec) {
    const g = ctx.createGain();
    g.gain.value = this._volume * vol;
    g.connect(ctx.destination);
    setTimeout(() => { try { g.disconnect(); } catch (_) {} }, (durationSec + 0.5) * 1000);
    return g;
  }

  _osc(ctx, type, freq) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  }

  _noise(ctx) {
    // Create a short buffer of white noise
    const bufLen = ctx.sampleRate * 0.8;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  _filter(ctx, type, freq, Q = 1) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = Q;
    return f;
  }

  _env(ctx, gain, atk, sus, rel, startVol = 0.001) {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(startVol, now);
    gain.gain.linearRampToValueAtTime(1, now + atk);
    gain.gain.setValueAtTime(1, now + atk + sus);
    gain.gain.linearRampToValueAtTime(0.0001, now + atk + sus + rel);
    return gain;
  }

  // ── Sounds ──────────────────────────────────────────────

  /** Monster roar with 1-second cooldown. */
  _roar(ctx) {
    if (this._roarCooling) return;
    this._roarCooling = true;
    setTimeout(() => { this._roarCooling = false; }, 1000);
    this._roarSound(ctx);
  }

  _roarSound(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.90, 0.8); // was 0.55

    // Noise burst (the "growl body")
    const noise = this._noise(ctx);
    const bp    = this._filter(ctx, 'bandpass', 180, 2.5);
    const lp    = this._filter(ctx, 'lowpass', 420);
    const env   = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.9,  now + 0.02);
    env.gain.setValueAtTime(0.9,           now + 0.15);
    env.gain.linearRampToValueAtTime(0.4,  now + 0.35);
    env.gain.linearRampToValueAtTime(0.001,now + 0.70);
    noise.connect(bp); bp.connect(lp); lp.connect(env); env.connect(out);
    noise.start(now); noise.stop(now + 0.8);

    // Low sine sub (adds menace)
    const sub  = this._osc(ctx, 'sine', 90);
    const subG = ctx.createGain();
    subG.gain.setValueAtTime(0.001, now);
    subG.gain.linearRampToValueAtTime(0.35, now + 0.04);
    subG.gain.linearRampToValueAtTime(0.001,now + 0.55);
    sub.connect(subG); subG.connect(out);
    sub.start(now); sub.stop(now + 0.6);

    // Pitch flutter (rumble effect)
    const sub2 = this._osc(ctx, 'sawtooth', 55);
    const lp2  = this._filter(ctx, 'lowpass', 160);
    const subG2= ctx.createGain();
    subG2.gain.setValueAtTime(0.001, now + 0.05);
    subG2.gain.linearRampToValueAtTime(0.20, now + 0.12);
    subG2.gain.linearRampToValueAtTime(0.001,now + 0.6);
    sub2.connect(lp2); lp2.connect(subG2); subG2.connect(out);
    sub2.start(now + 0.05); sub2.stop(now + 0.70);
  }

  /** Weapon swing — fast whoosh */
  _swing(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.45, 0.25);

    // High-pass noise sweep (the whoosh)
    const noise = this._noise(ctx);
    const hp    = this._filter(ctx, 'highpass', 800);
    const bp    = this._filter(ctx, 'bandpass', 1200, 0.8);
    bp.frequency.setValueAtTime(2000, now);
    bp.frequency.exponentialRampToValueAtTime(400, now + 0.18);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(1,    now + 0.01);
    env.gain.linearRampToValueAtTime(0.001,now + 0.22);
    noise.connect(hp); hp.connect(bp); bp.connect(env); env.connect(out);
    noise.start(now); noise.stop(now + 0.25);

    // Short crack transient
    const crack = this._osc(ctx, 'sawtooth', 600);
    const crackG = ctx.createGain();
    crackG.gain.setValueAtTime(0.001, now);
    crackG.gain.linearRampToValueAtTime(0.5, now + 0.005);
    crackG.gain.linearRampToValueAtTime(0.001, now + 0.06);
    crack.frequency.setValueAtTime(600, now);
    crack.frequency.linearRampToValueAtTime(200, now + 0.06);
    crack.connect(crackG); crackG.connect(out);
    crack.start(now); crack.stop(now + 0.07);
  }

  /** Player takes a hit — dull thud */
  _hit(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.60, 0.35);

    // Low thud
    const sine = this._osc(ctx, 'sine', 90);
    const sineG = ctx.createGain();
    sineG.gain.setValueAtTime(0.001, now);
    sineG.gain.linearRampToValueAtTime(1,    now + 0.008);
    sineG.gain.linearRampToValueAtTime(0.001,now + 0.22);
    sine.frequency.setValueAtTime(90, now);
    sine.frequency.linearRampToValueAtTime(45, now + 0.22);
    sine.connect(sineG); sineG.connect(out);
    sine.start(now); sine.stop(now + 0.25);

    // Noise thump layer
    const noise = this._noise(ctx);
    const lp    = this._filter(ctx, 'lowpass', 350);
    const nEnv  = ctx.createGain();
    nEnv.gain.setValueAtTime(0.001, now);
    nEnv.gain.linearRampToValueAtTime(0.6, now + 0.01);
    nEnv.gain.linearRampToValueAtTime(0.001, now + 0.18);
    noise.connect(lp); lp.connect(nEnv); nEnv.connect(out);
    noise.start(now); noise.stop(now + 0.25);

    // Grunt-ish short sine at 200Hz
    const grunt = this._osc(ctx, 'triangle', 200);
    const gruntG = ctx.createGain();
    gruntG.gain.setValueAtTime(0.001, now);
    gruntG.gain.linearRampToValueAtTime(0.45, now + 0.012);
    gruntG.gain.linearRampToValueAtTime(0.001, now + 0.14);
    grunt.connect(gruntG); gruntG.connect(out);
    grunt.start(now); grunt.stop(now + 0.15);
  }

  /** Gold coin pickup — bright jingle */
  _coin(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.40, 0.45);

    // Two metallic pings at different pitches, slightly offset
    [[2093, 0.00, 0.30], [2794, 0.05, 0.28], [3136, 0.09, 0.20]].forEach(([freq, delay, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + delay);
      g.gain.linearRampToValueAtTime(amp, now + delay + 0.008);
      g.gain.setTargetAtTime(0.001, now + delay + 0.04, 0.08);
      o.connect(g); g.connect(out);
      o.start(now + delay); o.stop(now + delay + 0.45);
    });
  }

  /** Equipment / item pickup — metallic clank */
  _equip(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.48, 0.50);

    // Main clank — heavier, percussive
    [[280, 1.00], [420, 0.70], [560, 0.50], [160, 0.55]].forEach(([freq, amp], i) => {
      const o = this._osc(ctx, 'triangle', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.006);
      g.gain.setTargetAtTime(0.001, now + 0.018, 0.06 + i * 0.01);
      o.connect(g); g.connect(out);
      o.start(now); o.stop(now + 0.45);
    });

    // Noise transient
    const noise = this._noise(ctx);
    const bp = this._filter(ctx, 'bandpass', 900, 3);
    const nG = ctx.createGain();
    nG.gain.setValueAtTime(0.001, now);
    nG.gain.linearRampToValueAtTime(0.9, now + 0.004);
    nG.gain.linearRampToValueAtTime(0.001, now + 0.055);
    noise.connect(bp); bp.connect(nG); nG.connect(out);
    noise.start(now); noise.stop(now + 0.08);
  }

  /** Potion pickup / use — liquid glug */
  _potion(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.80, 0.35);

    // Rising bubble: two quick sine sweeps (glug-glug), punchy
    [[0.00, 320, 560], [0.15, 280, 500]].forEach(([t, f0, f1]) => {
      const o = this._osc(ctx, 'sine', f0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t);
      g.gain.linearRampToValueAtTime(1.0, now + t + 0.015);
      g.gain.linearRampToValueAtTime(0.001, now + t + 0.13);
      o.frequency.setValueAtTime(f0, now + t);
      o.frequency.linearRampToValueAtTime(f1, now + t + 0.11);
      o.connect(g); g.connect(out);
      o.start(now + t); o.stop(now + t + 0.15);
    });
  }

  /** Chest creak open */
  _chest(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.42, 0.70);

    // Creak: noise with a bandpass that sweeps slowly
    const noise = this._noise(ctx);
    const bp = this._filter(ctx, 'bandpass', 200, 4);
    bp.frequency.setValueAtTime(200, now);
    bp.frequency.linearRampToValueAtTime(380, now + 0.40);
    bp.frequency.linearRampToValueAtTime(240, now + 0.65);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.8, now + 0.06);
    env.gain.setValueAtTime(0.6, now + 0.30);
    env.gain.linearRampToValueAtTime(0.001, now + 0.65);
    noise.connect(bp); bp.connect(env); env.connect(out);
    noise.start(now); noise.stop(now + 0.70);

    // Low thud at the end (lid landing)
    const thud = this._osc(ctx, 'sine', 70);
    const tG   = ctx.createGain();
    tG.gain.setValueAtTime(0.001, now + 0.55);
    tG.gain.linearRampToValueAtTime(0.6, now + 0.56);
    tG.gain.linearRampToValueAtTime(0.001, now + 0.68);
    thud.connect(tG); tG.connect(out);
    thud.start(now + 0.55); thud.stop(now + 0.70);
  }

  /** Stone footsteps on stairs — 4-step Dragon Quest-style sequence */
  _stairs(ctx, ascending) {
    const now = ctx.currentTime;
    // Total duration: 4 steps × ~0.18 s each = ~0.85 s
    const out = this._master(ctx, 0.85, 1.0);

    // Alternating heel/toe pitches for left-right feel, slightly louder 1st & 3rd
    const steps = ascending
      ? [{ t: 0.00, freq: 120, nf: 340, amp: 0.85 },
         { t: 0.18, freq: 100, nf: 290, amp: 0.70 },
         { t: 0.36, freq: 115, nf: 330, amp: 0.80 },
         { t: 0.54, freq:  95, nf: 280, amp: 0.65 }]
      : [{ t: 0.00, freq:  80, nf: 220, amp: 0.90 },
         { t: 0.18, freq:  68, nf: 190, amp: 0.75 },
         { t: 0.36, freq:  78, nf: 215, amp: 0.85 },
         { t: 0.54, freq:  65, nf: 185, amp: 0.70 }];

    steps.forEach(({ t, freq, nf, amp }) => {
      // Low thud sine
      const thud = this._osc(ctx, 'sine', freq);
      const tG   = ctx.createGain();
      tG.gain.setValueAtTime(0.001,     now + t);
      tG.gain.linearRampToValueAtTime(amp, now + t + 0.010);
      tG.gain.linearRampToValueAtTime(0.001, now + t + 0.14);
      thud.frequency.setValueAtTime(freq, now + t);
      thud.frequency.linearRampToValueAtTime(freq * 0.6, now + t + 0.14);
      thud.connect(tG); tG.connect(out);
      thud.start(now + t); thud.stop(now + t + 0.16);

      // Stone scrape noise burst
      const noise = this._noise(ctx);
      const lp    = this._filter(ctx, 'lowpass', nf);
      const nG    = ctx.createGain();
      nG.gain.setValueAtTime(0.001,       now + t);
      nG.gain.linearRampToValueAtTime(amp * 0.65, now + t + 0.008);
      nG.gain.linearRampToValueAtTime(0.001,  now + t + 0.10);
      noise.connect(lp); lp.connect(nG); nG.connect(out);
      noise.start(now + t); noise.stop(now + t + 0.12);
    });
  }

  /** Wooden door — short punchy knock + quick creak (~0.28 s total) */
  _door(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.80, 0.90);

    // Sharp wood thud
    const knock = this._osc(ctx, 'sine', 140);
    const knockG = ctx.createGain();
    knockG.gain.setValueAtTime(0.001, now);
    knockG.gain.linearRampToValueAtTime(0.80, now + 0.008);
    knockG.gain.linearRampToValueAtTime(0.001, now + 0.07);
    knock.frequency.linearRampToValueAtTime(70, now + 0.07);
    knock.connect(knockG); knockG.connect(out);
    knock.start(now); knock.stop(now + 0.08);

    // Brief bandpass creak
    [[360, 5.0, 0.80], [210, 3.5, 0.55]].forEach(([freq, Q, amp]) => {
      const n  = this._noise(ctx);
      const bp = this._filter(ctx, 'bandpass', freq, Q);
      bp.frequency.setValueAtTime(freq, now + 0.05);
      bp.frequency.linearRampToValueAtTime(freq * 0.65, now + 0.25);
      const eg = ctx.createGain();
      eg.gain.setValueAtTime(0.001, now + 0.04);
      eg.gain.linearRampToValueAtTime(amp,   now + 0.08);
      eg.gain.linearRampToValueAtTime(0.001, now + 0.28);
      n.connect(bp); bp.connect(eg); eg.connect(out);
      n.start(now + 0.04); n.stop(now + 0.30);
    });
  }

  /** Item consumed / scroll used — magical shimmer */
  _use(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.36, 0.45);

    // Rising sweep
    const sweep = this._osc(ctx, 'sine', 400);
    const sG    = ctx.createGain();
    sG.gain.setValueAtTime(0.001, now);
    sG.gain.linearRampToValueAtTime(0.7, now + 0.03);
    sG.gain.linearRampToValueAtTime(0.001, now + 0.35);
    sweep.frequency.setValueAtTime(400, now);
    sweep.frequency.exponentialRampToValueAtTime(1600, now + 0.30);
    sweep.connect(sG); sG.connect(out);
    sweep.start(now); sweep.stop(now + 0.38);

    // Sparkle tings
    [[0.10, 2093, 0.25], [0.20, 2794, 0.20], [0.28, 3520, 0.15]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t);
      g.gain.linearRampToValueAtTime(amp, now + t + 0.008);
      g.gain.setTargetAtTime(0.001, now + t + 0.01, 0.06);
      o.connect(g); g.connect(out);
      o.start(now + t); o.stop(now + t + 0.40);
    });
  }
  /** Elder healing — warm ascending chord with gentle sparkle */
  _elderHeal(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.45, 1.20);

    // Warm rising chord (healing energy)
    [[261, 0.00, 0.40], [329, 0.08, 0.35], [392, 0.16, 0.30], [523, 0.26, 0.25]].forEach(([freq, t, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t);
      g.gain.linearRampToValueAtTime(amp, now + t + 0.06);
      g.gain.setValueAtTime(amp * 0.7, now + t + 0.30);
      g.gain.linearRampToValueAtTime(0.001, now + t + 0.80);
      o.connect(g); g.connect(out);
      o.start(now + t); o.stop(now + t + 0.85);
    });

    // Gentle sparkle tings
    [[0.35, 2093, 0.18], [0.55, 2637, 0.15], [0.75, 3136, 0.12]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t);
      g.gain.linearRampToValueAtTime(amp, now + t + 0.008);
      g.gain.setTargetAtTime(0.001, now + t + 0.015, 0.10);
      o.connect(g); g.connect(out);
      o.start(now + t); o.stop(now + t + 0.60);
    });
  }

  // ── Skill Sounds ─────────────────────────────────────────

  /** Magic Bolt — sharp electric zap */
  _sndMagicBolt(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.55, 0.35);
    // Thin high sine zap
    const o = this._osc(ctx, 'sine', 900);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(0.8, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    o.frequency.setValueAtTime(900, now); o.frequency.exponentialRampToValueAtTime(2400, now + 0.20);
    o.connect(g); g.connect(out); o.start(now); o.stop(now + 0.25);
    // Electric crackle
    const noise = this._noise(ctx);
    const hp = this._filter(ctx, 'highpass', 1800);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5, now); ng.gain.linearRampToValueAtTime(0.001, now + 0.12);
    noise.connect(hp); hp.connect(ng); ng.connect(out);
    noise.start(now); noise.stop(now + 0.14);
  }

  /** Fireball — whoosh + low boom */
  _sndFireball(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.65, 0.55);
    // Swoosh
    const noise = this._noise(ctx);
    const bp = this._filter(ctx, 'bandpass', 400, 1.5);
    bp.frequency.setValueAtTime(800, now); bp.frequency.exponentialRampToValueAtTime(200, now + 0.25);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now); ng.gain.linearRampToValueAtTime(0.9, now + 0.04);
    ng.gain.linearRampToValueAtTime(0.001, now + 0.30);
    noise.connect(bp); bp.connect(ng); ng.connect(out);
    noise.start(now); noise.stop(now + 0.32);
    // Low boom at impact
    const boom = this._osc(ctx, 'sine', 80);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.001, now + 0.18); bg.gain.linearRampToValueAtTime(0.9, now + 0.21);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    boom.frequency.setValueAtTime(80, now + 0.18); boom.frequency.linearRampToValueAtTime(38, now + 0.55);
    boom.connect(bg); bg.connect(out); boom.start(now + 0.18); boom.stop(now + 0.58);
  }

  /** Ice Nova — cold crystalline burst */
  _sndIceNova(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.55, 0.45);
    // Icy descending sweep
    const sweep = this._osc(ctx, 'sine', 1800);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.001, now); sg.gain.linearRampToValueAtTime(0.6, now + 0.02);
    sg.gain.linearRampToValueAtTime(0.001, now + 0.35);
    sweep.frequency.setValueAtTime(1800, now); sweep.frequency.exponentialRampToValueAtTime(300, now + 0.35);
    sweep.connect(sg); sg.connect(out); sweep.start(now); sweep.stop(now + 0.37);
    // Crystal tings
    [[0.05, 3520, 0.20], [0.10, 4186, 0.18], [0.16, 2794, 0.15]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t); g.gain.linearRampToValueAtTime(amp, now + t + 0.006);
      g.gain.setTargetAtTime(0.001, now + t + 0.012, 0.05);
      o.connect(g); g.connect(out); o.start(now + t); o.stop(now + t + 0.35);
    });
  }

  /** Arcane Shield — rising shimmer + hum */
  _sndArcaneShield(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.50, 0.50);
    // Rising hum
    const hum = this._osc(ctx, 'sine', 200);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.001, now); hg.gain.linearRampToValueAtTime(0.6, now + 0.08);
    hg.gain.setValueAtTime(0.5, now + 0.25); hg.gain.linearRampToValueAtTime(0.001, now + 0.50);
    hum.frequency.setValueAtTime(200, now); hum.frequency.linearRampToValueAtTime(440, now + 0.30);
    hum.connect(hg); hg.connect(out); hum.start(now); hum.stop(now + 0.52);
    // Shimmer tings
    [[0.00, 2093, 0.25], [0.08, 2637, 0.22], [0.16, 3136, 0.18], [0.24, 4186, 0.15]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t); g.gain.linearRampToValueAtTime(amp, now + t + 0.006);
      g.gain.setTargetAtTime(0.001, now + t + 0.01, 0.07);
      o.connect(g); g.connect(out); o.start(now + t); o.stop(now + t + 0.42);
    });
  }

  /** Berserker Rage — short war cry burst */
  _sndBerserker(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.75, 0.50);
    // Guttural noise burst
    const noise = this._noise(ctx);
    const bp = this._filter(ctx, 'bandpass', 220, 2.0);
    const lp = this._filter(ctx, 'lowpass', 500);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now); ng.gain.linearRampToValueAtTime(0.9, now + 0.015);
    ng.gain.setValueAtTime(0.9, now + 0.12); ng.gain.linearRampToValueAtTime(0.001, now + 0.38);
    noise.connect(bp); bp.connect(lp); lp.connect(ng); ng.connect(out);
    noise.start(now); noise.stop(now + 0.42);
    // Growl undertone
    const rumble = this._osc(ctx, 'sawtooth', 65);
    const lp2 = this._filter(ctx, 'lowpass', 200);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.001, now); rg.gain.linearRampToValueAtTime(0.45, now + 0.02);
    rg.gain.linearRampToValueAtTime(0.001, now + 0.35);
    rumble.connect(lp2); lp2.connect(rg); rg.connect(out);
    rumble.start(now); rumble.stop(now + 0.38);
  }

  /** Whirlwind — sweeping spin whoosh */
  _sndWhirlwind(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.55, 0.50);
    // Spinning bandpass sweep — twice around
    [[0.00, 300, 900], [0.18, 900, 300], [0.30, 300, 700]].forEach(([t, f0, f1]) => {
      const noise = this._noise(ctx);
      const bp = this._filter(ctx, 'bandpass', f0, 2.5);
      bp.frequency.setValueAtTime(f0, now + t);
      bp.frequency.linearRampToValueAtTime(f1, now + t + 0.16);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.001, now + t); ng.gain.linearRampToValueAtTime(0.7, now + t + 0.03);
      ng.gain.linearRampToValueAtTime(0.001, now + t + 0.18);
      noise.connect(bp); bp.connect(ng); ng.connect(out);
      noise.start(now + t); noise.stop(now + t + 0.20);
    });
  }

  /** Shadow Step — teleport pop + sweep */
  _sndShadowStep(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.50, 0.35);
    // Vanish: descending sweep
    const vanish = this._osc(ctx, 'sine', 600);
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0.5, now); vg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    vanish.frequency.setValueAtTime(600, now); vanish.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    vanish.connect(vg); vg.connect(out); vanish.start(now); vanish.stop(now + 0.14);
    // Appear: ascending pop
    const appear = this._osc(ctx, 'sine', 120);
    const ag = ctx.createGain();
    ag.gain.setValueAtTime(0.001, now + 0.12); ag.gain.linearRampToValueAtTime(0.6, now + 0.15);
    ag.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    appear.frequency.setValueAtTime(120, now + 0.12); appear.frequency.exponentialRampToValueAtTime(800, now + 0.30);
    appear.connect(ag); ag.connect(out); appear.start(now + 0.12); appear.stop(now + 0.37);
  }

  /** Death Mark — dark ominous chord */
  _sndDeathMark(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.55, 0.55);
    // Dark minor cluster
    [[110, 0.45], [147, 0.30], [165, 0.20]].forEach(([freq, amp]) => {
      const o = this._osc(ctx, 'sawtooth', freq);
      const lp = this._filter(ctx, 'lowpass', 400);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(amp, now + 0.04);
      g.gain.setValueAtTime(amp * 0.6, now + 0.20); g.gain.linearRampToValueAtTime(0.001, now + 0.55);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(now); o.stop(now + 0.58);
    });
    // High ominous ping
    const ping = this._osc(ctx, 'sine', 1047);
    const pg = ctx.createGain();
    pg.gain.setValueAtTime(0.001, now); pg.gain.linearRampToValueAtTime(0.3, now + 0.006);
    pg.gain.setTargetAtTime(0.001, now + 0.012, 0.12);
    ping.connect(pg); pg.connect(out); ping.start(now); ping.stop(now + 0.55);
  }
  /** Town Scroll — portal opening whoosh + shimmer */
  _sndTownScroll(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.55, 0.75);
    // Rising sweep (portal opening)
    const sweep = this._osc(ctx, 'sine', 200);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.001, now); sg.gain.linearRampToValueAtTime(0.7, now + 0.05);
    sg.gain.linearRampToValueAtTime(0.001, now + 0.60);
    sweep.frequency.setValueAtTime(200, now); sweep.frequency.exponentialRampToValueAtTime(900, now + 0.55);
    sweep.connect(sg); sg.connect(out); sweep.start(now); sweep.stop(now + 0.65);
    // Portal hum
    const hum = this._osc(ctx, 'sine', 440);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.001, now + 0.10); hg.gain.linearRampToValueAtTime(0.35, now + 0.20);
    hg.gain.linearRampToValueAtTime(0.001, now + 0.65);
    hum.frequency.setValueAtTime(440, now + 0.10); hum.frequency.linearRampToValueAtTime(880, now + 0.60);
    hum.connect(hg); hg.connect(out); hum.start(now + 0.10); hum.stop(now + 0.68);
    // Sparkle tings
    [[0.15, 2093, 0.30], [0.25, 2794, 0.25], [0.35, 3520, 0.20], [0.45, 4186, 0.15]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t); g.gain.linearRampToValueAtTime(amp, now + t + 0.008);
      g.gain.setTargetAtTime(0.001, now + t + 0.01, 0.06);
      o.connect(g); g.connect(out); o.start(now + t); o.stop(now + t + 0.45);
    });
  }

  /** Portal Return — descending whoosh + landing thump */
  _sndPortalReturn(ctx) {
    const now = ctx.currentTime;
    const out = this._master(ctx, 0.60, 0.65);
    // Descending sweep (exiting portal)
    const sweep = this._osc(ctx, 'sine', 900);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.001, now); sg.gain.linearRampToValueAtTime(0.7, now + 0.03);
    sg.gain.linearRampToValueAtTime(0.001, now + 0.55);
    sweep.frequency.setValueAtTime(900, now); sweep.frequency.exponentialRampToValueAtTime(200, now + 0.50);
    sweep.connect(sg); sg.connect(out); sweep.start(now); sweep.stop(now + 0.58);
    // Low thump on landing
    const thump = this._osc(ctx, 'sine', 60);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.001, now + 0.40); tg.gain.linearRampToValueAtTime(0.6, now + 0.43);
    tg.gain.linearRampToValueAtTime(0.001, now + 0.62);
    thump.connect(tg); tg.connect(out); thump.start(now + 0.40); thump.stop(now + 0.65);
    // Shimmer tings (high to low — arrival echo)
    [[0.05, 3136, 0.20], [0.12, 2637, 0.18], [0.20, 2093, 0.15]].forEach(([t, freq, amp]) => {
      const o = this._osc(ctx, 'sine', freq);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + t); g.gain.linearRampToValueAtTime(amp, now + t + 0.008);
      g.gain.setTargetAtTime(0.001, now + t + 0.01, 0.08);
      o.connect(g); g.connect(out); o.start(now + t); o.stop(now + t + 0.50);
    });
  }
}

// ── Singleton export ────────────────────────────────────────
export const SFX = new SoundEffectsEngine();
