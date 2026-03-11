import type { BreathPreset } from '../types/breathing';

const STORAGE_KEY = 'breathing_presets_v1';

/**
 * Very small abstraction over localStorage for preset CRUD.
 *
 * In a real system this would be backed by a database table `breath_presets`.
 * Here we assume a single local user and store records in the browser.
 */
class PresetManager {
  private presets: BreathPreset[] = [];
  private initialized = false;

  private ensureLoaded() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.presets = [
          {
            id: 'box_default',
            name: 'Box Breath',
            inhaleSec: 4,
            holdInSec: 4,
            exhaleSec: 4,
            holdOutSec: 4,
            isDefault: true,
          },
        ];
        this.persist();
        return;
      }
      const parsed = JSON.parse(raw) as BreathPreset[];
      this.presets = parsed;
    } catch {
      this.presets = [];
    }
  }

  private persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
    } catch {
      // If storage is unavailable (e.g., in private mode), we silently fail.
    }
  }

  list(): BreathPreset[] {
    this.ensureLoaded();
    return [...this.presets];
  }

  getById(id: string): BreathPreset | undefined {
    this.ensureLoaded();
    return this.presets.find((p) => p.id === id);
  }

  create(preset: Omit<BreathPreset, 'id'>): BreathPreset {
    this.ensureLoaded();
    const id = `preset_${crypto.randomUUID()}`;
    const record: BreathPreset = { ...preset, id };
    this.presets.push(record);
    this.persist();
    return record;
  }

  update(preset: BreathPreset): BreathPreset {
    this.ensureLoaded();
    const index = this.presets.findIndex((p) => p.id === preset.id);
    if (index === -1) {
      this.presets.push(preset);
    } else {
      this.presets[index] = preset;
    }
    this.persist();
    return preset;
  }

  delete(id: string): void {
    this.ensureLoaded();
    this.presets = this.presets.filter((p) => p.id !== id);
    this.persist();
  }
}

export const presetManager = new PresetManager();

