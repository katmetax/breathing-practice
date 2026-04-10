import { BreathPhase, StartEndPhase } from '@/types/breathing'

const useAudio = (source: string) => {
  const audio = new Audio(source)

  if (!audio) return

  // Reset the playhead in case it's clicked rapidly
  audio.currentTime = 0

  audio.play().catch((err) => {
    console.error('Audio playback failed:', err)
  })
}

const playCountdownTone = () => useAudio('')
const playInhaleTone = () =>
  useAudio('assets/sounds/577856__iainmccurdy__tibetan-singing-bowl-10-cm-struck.mp3')
const playExhaleTone = () => useAudio('assets/sounds/531268__asuriya__aud-7-chakra-5-bowl.mp3')
const playHoldTone = () =>
  useAudio('assets/sounds/535950__mttvn__e-flat-tibetan-singing-bowl-struck.mp3')
const playEndOfSessionTone = () =>
  useAudio('assets/sounds/242394__ascap__wood-hit-low-glass-bowl-5.mp3')

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

export default playTone
