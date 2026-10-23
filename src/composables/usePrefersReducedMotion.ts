import { onBeforeUnmount, ref } from 'vue'

export function usePrefersReducedMotion() {
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const reduced = ref(!!mq?.matches)
  const onChange = (e: MediaQueryListEvent) => (reduced.value = e.matches)
  mq?.addEventListener?.('change', onChange)
  onBeforeUnmount(() => mq?.removeEventListener?.('change', onChange))
  return reduced
}
