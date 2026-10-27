import type { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'

export const heartbeat = (connection: WebSocket) =>
  connection.send(JSON.stringify({ method: 'ping' }))

export const customSubscriptionMessages = <T>(
  subscriptions: SubscriptionDeltas<T>,
  buildPair: (param: T) => string,
  subscribe: string,
  unsubscribe: string,
) => {
  const messages = []

  const desired = new Set(subscriptions.desired.map(buildPair))
  const stale = new Set(subscriptions.stale.map(buildPair).filter((pair) => !desired.has(pair)))

  if (subscriptions.new.length > 0 && subscriptions.desired.length > 0) {
    messages.push({
      method: subscribe,
      params: { pairs: Array.from(desired) }, // Nobi's subscribe replaces rather than adds
    })
  }

  if (stale.size > 0) {
    messages.push({
      method: unsubscribe,
      params: { pairs: Array.from(stale) },
    })
  }

  return messages
}
