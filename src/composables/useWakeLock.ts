import { onUnmounted } from 'vue'

export function useWakeLock() {
  let wakeLock: WakeLockSentinel | null = null
  let wantLock = false

  async function requestWakeLock() {
    wantLock = true
    if (!('wakeLock' in navigator)) return
    if (document.visibilityState !== 'visible') return
    try {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', () => {
        wakeLock = null
      })
    } catch {
      // unsupported or permission denied — degrade silently
    }
  }

  async function releaseWakeLock() {
    wantLock = false
    if (wakeLock) {
      await wakeLock.release()
      wakeLock = null
    }
  }

  async function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && wantLock) {
      await requestWakeLock()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    releaseWakeLock()
  })

  return { requestWakeLock, releaseWakeLock }
}
