// 音效管理器
'use client';

export class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  /**
   * 加载音效
   */
  loadSound(name: string, url: string): void {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio(url);
    audio.volume = this.volume;
    this.sounds.set(name, audio);
  }

  /**
   * 播放音效
   */
  play(name: string, volume?: number): void {
    if (!this.enabled || typeof window === 'undefined') return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      const audio = sound.cloneNode() as HTMLAudioElement;
      if (volume !== undefined) {
        audio.volume = volume;
      }
      audio.play().catch(err => {
        console.warn('Failed to play sound:', err);
      });
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// 单例实例
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}
