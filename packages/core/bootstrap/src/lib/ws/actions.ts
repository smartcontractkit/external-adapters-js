import { AdapterRequest, WSHandler } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'
import { asAction } from '../store'
import { WSConfig, WSConnectionInfo } from './types'

/** CONNECTIONS */
export interface WSConfigPayload {
  config: WSConfig
  // TODO: wsHandler should not be sent as an event
  wsHandler: WSHandler
}

export interface WSErrorPayload {
  connectionInfo: WSConnectionInfo
  reason: string
}

export const connect = createAction('WS/CONNECT!', asAction<WSConfigPayload>())
export const connected = createAction('WS/CONNECTED', asAction<WSConfigPayload>())
export const connectionError = createAction('WS/CONNECTION_ERROR', asAction<WSErrorPayload>())
export const disconnected = createAction('WS/DISCONNECTED', asAction<WSConfigPayload>())

export const disconnect = createAction('WS/DISCONNECT!', asAction<WSConfigPayload>())

/** SUBSCRIPTIONS */
export interface WSSubscriptionPayload {
  connectionInfo: WSConnectionInfo
  subscriptionMsg: any
  input: AdapterRequest
}

export interface WSSubscriptionErrorPayload extends WSErrorPayload {
  subscriptionMsg?: any
  input?: AdapterRequest
}

export const subscribeRequested = createAction(
  'WS/SUBSCRIBE_REQUESTED',
  asAction<WSSubscriptionPayload>(),
)
export const subscribeFulfilled = createAction(
  'WS/SUBSCRIBE_FULFILLED',
  asAction<WSSubscriptionPayload>(),
)
export const subscriptionError = createAction(
  'WS/SUBSCRIPTION_ERROR',
  asAction<WSSubscriptionErrorPayload>(),
)
export const unsubscribeRequested = createAction(
  'WS/UNSUBSCRIBE_REQUESTED',
  asAction<WSSubscriptionPayload>(),
)
export const unsubscribeFulfilled = createAction(
  'WS/UNSUBSCRIBE_FULFILLED',
  asAction<WSSubscriptionPayload>(),
)

/** MESSAGEs */
export interface WSMessagePayload {
  message: unknown
  subscriptionKey: string
}

export const messageReceived = createAction('WS/MESSAGE_RECEIVED', asAction<WSMessagePayload>())
