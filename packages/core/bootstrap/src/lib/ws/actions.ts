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
  message: string
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

export const subscribe = createAction('WS/SUBSCRIBE!', asAction<WSSubscriptionPayload>())
export const subscribed = createAction('WS/SUBSCRIBED', asAction<WSSubscriptionPayload>())
export const unsubscribe = createAction('WS/UNSUBSCRIBE!', asAction<WSSubscriptionPayload>())
export const unsubscribed = createAction('WS/UNSUBSCRIBED', asAction<WSSubscriptionPayload>())

/** MESSAGEs */
export interface WSMessagePayload {
  message: unknown
  subscriptionKey: string
}

export const messageReceived = createAction('WS/MESSAGE_RECEIVED', asAction<WSMessagePayload>())
