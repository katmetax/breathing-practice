import { BreathPhase, StartEndPhase } from '@/types/breathing'

const SOUNDS: Record<string, string> = {
  inhale:  'assets/sounds/577856__iainmccurdy__tibetan-singing-bowl-10-cm-struck.mp3',
  holdIn:  'assets/sounds/535950__mttvn__e-flat-tibetan-singing-bowl-struck.mp3',
  exhale:  'assets/sounds/531268__asuriya__aud-7-chakra-5-bowl.mp3',
  holdOut: 'assets/sounds/535950__mttvn__e-flat-tibetan-singing-bowl-struck.mp3',
  end:     'assets/sounds/242394__ascap__wood-hit-low-glass-bowl-5.mp3',
}

const preloaded: Record<string, HTMLAudioElement> = {}
for (const [key, src] of Object.entries(SOUNDS)) {
  const el = new Audio(src)
  el.preload = 'auto'
  preloaded[key] = el
}

let currentAudio: HTMLAudioElement | null = null

const stopTone = () => {
  if (!currentAudio) return
  currentAudio.pause()
  currentAudio.currentTime = 0
  currentAudio = null
}

const useAudio = (key: string) => {
  stopTone()
  const audio = preloaded[key]
  if (!audio) return
  audio.currentTime = 0
  currentAudio = audio
  audio.play().catch((err) => {
    console.error('Audio playback failed:', err)
    if (currentAudio === audio) currentAudio = null
  })
}

const playCountdownTone = () => {}
const playInhaleTone = () => useAudio('inhale')
const playExhaleTone = () => useAudio('exhale')
const playHoldTone = () => useAudio('holdIn')
const playEndOfSessionTone = () => useAudio('end')

const playTone = (phase: BreathPhase | StartEndPhase) => {
  switch (phase) {
    case BreathPhase.INHALE:
      return playInhaleTone()
    case BreathPhase.HOLD_IN:
      return playHoldTone()
    case BreathPhase.EXHALE:
      return playExhaleTone()
    case BreathPhase.HOLD_OUT:
      return playHoldTone()
    case StartEndPhase.START:
      return playCountdownTone()
    case StartEndPhase.END:
      return playEndOfSessionTone()
    default:
      return ''
  }
}

export { playTone, stopTone }
