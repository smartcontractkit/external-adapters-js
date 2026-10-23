import type { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'

export const heartbeat = (connection: WebSocket) =>
  connection.send(JSON.stringify({ method: 'ping' }))

export const customSubscriptionMessages = <T>(
  subscriptions: SubscriptionDeltas<T>,
  buildPair: (param: T) => string,
) => {
  const messages = []

  if (subscriptions.new.length > 0) {
    messages.push({
      method: 'subscribe',
      params: { pairs: subscriptions.desired.map(buildPair) }, // Nobi's subscribe replaces rather than adds
    })
  }

  if (subscriptions.stale.length > 0) {
    messages.push({
      method: 'unsubscribe',
      params: { pairs: subscriptions.stale.map(buildPair) },
    })
  }

  return messages
}
