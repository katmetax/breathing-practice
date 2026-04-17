import type { BreathSessionRecord } from '../types/breathing'
import { createId } from '../utils/createId'

const HISTORY_KEY = 'breathing_sessions_v1'

/**
 * Lightweight local history store standing in for the `breath_sessions` table.
 *
 * Only minimal, non-intrusive stats are kept: date and duration.
 * There are deliberately no streak counters or gamified metrics.
 */
class HistoryService {
  private sessions: BreathSessionRecord[] = []
  private initialized = false

  private ensureLoaded() {
    if (this.initialized) return
    this.initialized = true

    try {
      const raw = window.localStorage.getItem(HISTORY_KEY)
      if (!raw) {
        this.sessions = []
        return
      }
      this.sessions = JSON.parse(raw) as BreathSessionRecord[]
    } catch {
      this.sessions = []
    }
  }

  private persist() {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(this.sessions))
    } catch {
      // Ignore storage errors to keep UX smooth.
    }
  }

  listAll(): BreathSessionRecord[] {
    this.ensureLoaded()
    return [...this.sessions]
  }

  listRecent(limit = 50): BreathSessionRecord[] {
    this.ensureLoaded()
    return [...this.sessions]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit)
  }

  add(record: Omit<BreathSessionRecord, 'id' | 'completedAt'>) {
    this.ensureLoaded()
    const fullRecord: BreathSessionRecord = {
      id: createId("session_"),
      completedAt: new Date().toISOString(),
      ...record,
    }
    this.sessions.push(fullRecord)
    this.persist()
  }
}

export const historyService = new HistoryService()
