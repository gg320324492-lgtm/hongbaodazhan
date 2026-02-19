// 将可能来自 JSON 的 gameState 规范化，确保 players 为 Map
import type { GameState, Player } from '../../types/game';

function ensurePlayersMap(players: unknown): Map<string, Player> {
  if (players instanceof Map) return players;
  if (players && typeof players === 'object' && !Array.isArray(players)) {
    return new Map(Object.entries(players) as [string, Player][]);
  }
  return new Map();
}

export function normalizeGameState(raw: GameState | Record<string, unknown> | null): GameState | null {
  if (!raw) return null;
  return {
    ...raw,
    players: ensurePlayersMap(raw.players),
    bullets: Array.isArray(raw.bullets) ? raw.bullets : [],
    powerUps: Array.isArray(raw.powerUps) ? raw.powerUps : [],
    particles: Array.isArray(raw.particles) ? raw.particles : [],
    gameTime: typeof raw.gameTime === 'number' ? raw.gameTime : 0,
    gameStatus: raw.gameStatus ?? 'waiting',
    winner: raw.winner ?? null,
  } as GameState;
}
