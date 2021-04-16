import { AdapterRequest, WSSubscriptionHandler } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'
import { asAction } from '../store'
import { WSConnectionInfo, WSConfig } from './types'

/** CONNECTIONS */
export interface WSConfigPayload {
  config: WSConfig
  wsHandler: WSSubscriptionHandler
}

export const connect = createAction('WS/CONNECT!', asAction<WSConfigPayload>())
export const connected = createAction('WS/CONNECTED', asAction<WSConfigPayload>())
export const connectionError = createAction('WS/CONNECTION_ERROR', asAction<WSConfigPayload>())
export const disconnected = createAction('WS/DISCONNECTED', asAction<WSConfigPayload>())
export interface WSConnectionPayload {
  connectionInfo: WSConnectionInfo
}

export const disconnect = createAction('WS/DISCONNECT!', asAction<WSConnectionPayload>())

/** SUBSCRIPTIONS */
export interface WSSubscriptionPayload {
  connectionInfo: WSConnectionInfo
  subscriptionMsg: any
  message: unknown
  input: AdapterRequest
}

export interface WSMessage {
  message: unknown
}

export const subscribe = createAction('WS/SUBSCRIBE!', asAction<WSSubscriptionPayload>())
export const subscribed = createAction('WS/SUBSCRIBED', asAction<WSSubscriptionPayload>())
export const unsubscribe = createAction('WS/UNSUBSCRIBE!', asAction<WSSubscriptionPayload>())
export const unsubscribed = createAction('WS/UNSUBSCRIBED', asAction<WSSubscriptionPayload>())
export const messageReceived = createAction('WS/MESSAGE_RECEIVED!', asAction<WSMessage>())
