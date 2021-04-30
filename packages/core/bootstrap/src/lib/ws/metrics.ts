import * as client from 'prom-client'

export const ws_connection_active = new client.Gauge({
  name: 'ws_connection_active',
  help: 'The number of active connections',
  labelNames: ['key', 'url', 'experimental'] as const,
})

export const ws_connection_errors = new client.Counter({
  name: 'ws_connection_errors',
  help: 'The number of connection errors',
  labelNames: ['key', 'url', 'message', 'experimental'] as const,
})

export const ws_connection_retries = new client.Counter({
  name: 'ws_connection_retries',
  help: 'The number of connection retries',
  labelNames: ['key', 'url', 'experimental'] as const,
})

export const ws_subscription_active = new client.Gauge({
  name: 'ws_subscription_active',
  help: 'The number of active subscriptions',
  labelNames: ['connection_key', 'connection_url', 'feed_id', 'subscription_key', 'experimental'] as const,
})

export const ws_subscription_total = new client.Counter({
  name: 'ws_subscription_total',
  help: 'The number of subscriptions opened in total',
  labelNames: ['connection_key', 'connection_url', 'feed_id', 'subscription_key', 'experimental'] as const,
})

export const ws_message_total = new client.Counter({
  name: 'ws_message_total',
  help: 'The number of messages received in total',
  labelNames: ['connection_key', 'connection_url', 'feed_id', 'subscription_key', 'experimental'] as const,
})

// TODO: Message error action
export const ws_message_errors = new client.Counter({
  name: 'ws_message_errors',
  help: 'The number of message errors received in total',
  labelNames: ['connection_key', 'connection_url', 'subscription_key', 'experimental'] as const,
})
