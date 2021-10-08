import { AdapterContext, AdapterRequest, WSHandler } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'
import { WebSocketSubject } from 'rxjs/webSocket'
import { asAction } from '../store'
import { WSConfig, WSConnectionInfo } from './types'

/** CONNECTIONS */
export interface WSConfigPayload {
  config: WSConfig
  // TODO: wsHandler should not be sent as an event
  wsHandler: WSHandler
}

export interface WSConnectFulfilledPayload extends WSConfigPayload {
  connectionInfo: WSConnectionInfo
}

export interface WSConfigDetailedPayload extends WSConfigPayload {
  request: AdapterRequest
  context: AdapterContext
  wsHandler: WSHandler
}

export interface WSConfigDetailedPayloadOverride extends WSConfigDetailedPayload {
  wsHandler: WSHandlerOverride
}

export interface WSErrorPayload {
  connectionInfo: WSConnectionInfo
  reason: string
}

export interface WSSaveFirstMessagePayload {
  subscriptionKey: string
  message: any
}

export interface WSUpdateSubscriptionInputPayload {
  subscriptionKey: string
  input: AdapterRequest
}

export interface WSRunOnConnectFunctions {
  wsHandler: WSHandler
  wsSubject: WebSocketSubject<any>
  input: AdapterRequest
}

export interface WSSaveMessageToConnection {
  connectionKey: string
  message: any
}

export const runOnConnectFunctions = createAction(
  'WS/RUN_ON_CONNECT_FUNCTIONS',
  asAction<WSRunOnConnectFunctions>(),
)
export const updateSubscriptionInput = createAction(
  'WS/UPDATE_SUBSRCRIPTION_INPUT',
  asAction<WSUpdateSubscriptionInputPayload>(),
)
export const saveFirstMessageReceived = createAction(
  'WS/SAVE_FIRST_MESSAGE_RECEIVED',
  asAction<WSSaveFirstMessagePayload>(),
)
export const wsSubscriptionReady = createAction(
  'WS/SUBSCRIPTION_READY',
  asAction<WSConfigDetailedPayloadOverride>(),
)
export const connectRequested = createAction(
  'WS/CONNECT_REQUESTED',
  asAction<WSConfigDetailedPayload>(),
)
export const connectFulfilled = createAction(
  'WS/CONNECT_FULFILLED',
  asAction<WSConnectFulfilledPayload>(),
)
export const connectFailed = createAction('WS/CONNECTION_FAILED', asAction<WSErrorPayload>())
export const disconnectFulfilled = createAction(
  'WS/DISCONNECT_FULFILLED',
  asAction<WSConfigPayload>(),
)
export const disconnectRequested = createAction(
  'WS/DISCONNECT_REQUESTED',
  asAction<WSConfigPayload>(),
)
export const saveOnConnectMessage = createAction(
  'WS/SAVE_ON_CONNECT_MESSAGE',
  asAction<WSSaveMessageToConnection>(),
)
export const incrementOnConnectIdx = createAction(
  'WS/INCREMENT_ON_CONNECT_IDX',
  asAction<{ key: string }>(),
)
export const onConnectComplete = createAction(
  'WS/ON_CONNECT_COMPLETE',
  asAction<WSSubscriptionPayload>(),
)

/** SUBSCRIPTIONS */
export interface WSSubscriptionPayload {
  connectionInfo: WSConnectionInfo
  subscriptionMsg: any
  input: AdapterRequest
  context: AdapterContext
  messageToSave?: any
  filterMultiplex?: (message: any) => boolean
  shouldNeverUnsubscribe?: boolean
}

export interface WSSubscriptionErrorPayload extends WSErrorPayload {
  subscriptionMsg?: any
  input?: AdapterRequest
  error?: unknown
  wsHandler: WSHandlerOverride
}

export interface WSSubscriptionErrorHandlerPayload {
  connectionInfo: WSConnectionInfo
  subscriptionMsg?: any
  shouldNotRetrySubscription: boolean
  shouldNotRetryConnection: boolean
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
export const subscriptionErrorHandler = createAction(
  'WS/SUBSCRIPTION_ERROR_HANDLER',
  asAction<WSSubscriptionErrorHandlerPayload>(),
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
  input: AdapterRequest
  context: AdapterContext
  connectionInfo: WSConnectionInfo
  wsHandler: WSHandlerOverride
}

export const messageReceived = createAction('WS/MESSAGE_RECEIVED', asAction<WSMessagePayload>())

/** OVERRIDES */
export interface WSHandlerOverride extends WSHandler {
  connection: {
    url: string
    protocol?: any
  }
}
export interface WSConfigOverride extends WSConfigDetailedPayload {
  wsHandler: WSHandlerOverride
}
