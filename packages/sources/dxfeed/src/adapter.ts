import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export type DXFeedMessage = {
  channel: string
  clientId?: string
  id: string
  data: any[]
  successful?: boolean
  advice?: {
    interval: number
    timeout: number
    reconnect: string
  }
}[]

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (request: 'subscribe' | 'unsubscribe', ticker?: string) => {
    if (!ticker) return
    return [
      {
        channel: SERVICE_SUB,
        data: {
          [`${request === 'subscribe' ? 'add' : 'remove'}`]: {
            Quote: [ticker],
          },
        },
      },
    ]
  }

  const META_HANDSHAKE = '/meta/handshake'
  const META_CONNECT = '/meta/connect'
  const SERVICE_SUB = '/service/sub'
  const SERVICE_DATA = '/service/data'

  return () => {
    const defaultConfig = config || makeConfig()
    const isDataMessage = (message: DXFeedMessage) =>
      Array.isArray(message) && message[0].channel === SERVICE_DATA
    const isDataSubscriptionMsg = (subscriptionMessage: any) =>
      Array.isArray(subscriptionMessage) && subscriptionMessage[0].channel === SERVICE_SUB

    const handshakeMsg = [
      {
        id: '1',
        version: '1.0',
        minimumVersion: '1.0',
        channel: '/meta/handshake',
        supportedConnectionTypes: ['websocket', 'long-polling', 'callback-polling'],
        advice: {
          timeout: 60000,
          interval: 0,
        },
      },
    ]

    const firstHeartbeatMsg = [
      {
        id: '2',
        channel: META_CONNECT,
        connectionType: 'websocket',
        advice: {
          timeout: 0,
        },
      },
    ]

    const heartbeatMsg = [
      {
        id: '3',
        channel: META_CONNECT,
        connectionType: 'websocket',
      },
    ]

    return {
      connection: {
        url: defaultConfig.api.baseWsURL,
      },
      subscribe: (input) => {
        const validator = new Validator(input, endpoints.price.inputParameters)
        if (validator.errored) throw validator.errored
        const ticker = validator.validated.data.base
        return getSubscription('subscribe', ticker)
      },
      unsubscribe: (input) => {
        const validator = new Validator(input, endpoints.price.inputParameters)
        if (validator.errored) throw validator.errored
        const ticker = validator.validated.data.base
        return getSubscription('unsubscribe', ticker)
      },
      subsFromMessage: (message: DXFeedMessage) => {
        switch (message[0].channel) {
          case META_HANDSHAKE:
            return handshakeMsg
          case META_CONNECT:
            return heartbeatMsg
          case SERVICE_DATA:
            return getSubscription('subscribe', message[0].data[1][0])
          default:
            return null
        }
      },
      isError: (message) => (message as DXFeedMessage)[0].successful === false,
      filter: (message: DXFeedMessage) => {
        return isDataMessage(message)
      },
      toResponse: (message: DXFeedMessage) => {
        const data = message[0].data[1]
        const result = data[6]
        return Requester.success('1', { data: { ...message[0], result } }, defaultConfig.verbose)
      },
      saveOnConnectToConnection: (message: DXFeedMessage) => {
        return {
          requestId: parseInt(message[0].id),
          clientId: message[0].clientId,
        }
      },
      modifySubscriptionPayload: (original, _, connectionParams, id) => {
        original[0].clientId = connectionParams.clientId
        original[0].id = id.toString()
        return original
      },
      shouldModifyPayload: (payload) =>
        payload[0].channel === META_CONNECT || payload[0].channel === SERVICE_SUB,
      shouldSaveToConnection: (message: DXFeedMessage) => {
        return !!message[0].clientId
      },
      shouldReplyToServerHeartbeat: (message) => {
        const dxFeedMsg = message as DXFeedMessage
        return Object.keys(dxFeedMsg[0]).length === 3 && dxFeedMsg[0].channel === META_CONNECT
      },
      heartbeatReplyMessage: (message, _, connectionParams) => [
        {
          id: parseInt((message as DXFeedMessage)[0].id) + 1,
          channel: META_CONNECT,
          connectionType: 'websocket',
          clientId: connectionParams.clientId,
        },
      ],
      heartbeatIntervalInMS: 30000,
      shouldSaveToStore: (subscriptionMessage: any) => isDataSubscriptionMsg(subscriptionMessage),
      isOnConnectChainMessage: (message: DXFeedMessage) =>
        message[0].channel === META_HANDSHAKE || message[0].channel === META_CONNECT,
      isDataMessage: (message: unknown) => isDataSubscriptionMsg(message),
      onConnectChain: [
        {
          payload: handshakeMsg,
        },
        {
          payload: firstHeartbeatMsg,
          filter: (message: DXFeedMessage) => message[0].id == '2',
        },
        {
          payload: heartbeatMsg,
          filter: (message: DXFeedMessage) =>
            message[0].id === '3' ||
            (Object.keys(message[0]).length === 3 && message[0].channel === META_CONNECT),
          shouldNeverUnsubscribe: true,
        },
      ],
    }
  }
}
