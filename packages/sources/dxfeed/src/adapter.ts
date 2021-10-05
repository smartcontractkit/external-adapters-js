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
  id: number
  data: any[]
  successful?: boolean
}[]

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (request: 'subscribe' | 'unsubscribe', ticker?: string) => {
    if (!ticker) return
    return [
      {
        channel: '/service/sub',
        data: {
          [`${request === 'subscribe' ? 'add' : 'remove'}`]: {
            Quote: [ticker],
          },
        },
      },
    ]
  }

  const META_CONNECT = '/meta/connect'

  return () => {
    const defaultConfig = config || makeConfig()
    const isDataMessage = (message: DXFeedMessage) =>
      Array.isArray(message) && message[0].channel === '/service/data'
    const isDataSubscriptionMsg = (subscriptionMessage: any) =>
      Array.isArray(subscriptionMessage) && subscriptionMessage[0].channel === '/service/sub'
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
      subsFromMessage: (message) => {
        if (isDataMessage(message)) {
          const pair = message[0].data[1][0]
          return getSubscription('subscribe', pair)
        }
        return null
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
          requestId: message[0].id,
          clientId: message[0].clientId,
        }
      },
      modifySubscriptionPayload: (original, _, connectionParams, id) => {
        original[0].clientId = connectionParams.clientId
        original[0].id = id.toString()
        return original
      },
      shouldModifyPayload: (payload) => isDataSubscriptionMsg(payload),
      shouldSaveToConnection: (message: DXFeedMessage) => {
        return !!message[0].clientId
      },
      shouldReplyToServerHeartbeat: (message) =>
        (message as DXFeedMessage)[0].channel === META_CONNECT,
      heartbeatReplyMessage: (_, id, connectionParams) => [
        {
          id: id.toString(),
          channel: META_CONNECT,
          connectionType: 'websocket',
          clientId: connectionParams.clientId,
        },
      ],
      heartbeatIntervalInMS: 30000,
      shouldSaveToStore: (subscriptionMessage: any) => isDataSubscriptionMsg(subscriptionMessage),
      isOnConnectChainMessage: (message: DXFeedMessage) =>
        message[0].channel === '/meta/handshake' || message[0].channel === META_CONNECT,
      isDataMessage: (message: unknown) => isDataSubscriptionMsg(message),
      onConnectChain: [
        () => [
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
        ],
        (_, prevWsResponse, connectionParams) => [
          {
            id: '2',
            channel: META_CONNECT,
            connectionType: 'websocket',
            advice: {
              timeout: 0,
            },
            clientId: prevWsResponse[0].clientId || connectionParams.clientId,
          },
        ],
        (_, prevWsResponse, connectionParams) => [
          {
            id: '3',
            channel: META_CONNECT,
            connectionType: 'websocket',
            clientId: prevWsResponse[0].clientId || connectionParams.clientId,
          },
        ],
      ],
    }
  }
}
