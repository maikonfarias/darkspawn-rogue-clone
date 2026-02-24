// ============================================================
//  Darkspawn Rogue Quest — Settings (localStorage)
//  Stored under a distinct key to avoid colliding with save data.
// ============================================================

const SETTINGS_KEY = 'darkspawn_settings';

const _defaults = { musicEnabled: true, sfxEnabled: true };
let _s = { ..._defaults };

export const Settings = {
  /** Load from localStorage. Call once at boot. */
  load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) _s = { ..._defaults, ...JSON.parse(raw) };
    } catch (_) {}
  },

  /** Persist current settings. */
  save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        musicEnabled: _s.musicEnabled,
        sfxEnabled:   _s.sfxEnabled,
      }));
    } catch (_) {}
  },

  /**
   * Apply loaded settings to the Music and SFX singletons.
   * Call after load() and after Music/SFX are available.
   */
  apply(Music, SFX) {
    Music.musicEnabled = _s.musicEnabled;
    SFX.muted          = !_s.sfxEnabled;
  },

  get musicEnabled() { return _s.musicEnabled; },
  set musicEnabled(v) { _s.musicEnabled = !!v; },

  get sfxEnabled()    { return _s.sfxEnabled; },
  set sfxEnabled(v)   { _s.sfxEnabled = !!v; },
};
