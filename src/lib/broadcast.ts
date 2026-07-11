import type { DisplayEvent } from './types'

const CHANNEL = 'boom-biblico'

export function createSender() {
  const channel = new BroadcastChannel(CHANNEL)
  return {
    send: (event: DisplayEvent) => channel.postMessage(event),
    close: () => channel.close(),
  }
}

export function createReceiver(onEvent: (event: DisplayEvent) => void) {
  const channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (e: MessageEvent) => onEvent(e.data as DisplayEvent)
  return {
    close: () => channel.close(),
  }
}
