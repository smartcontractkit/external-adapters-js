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

  return () => {
    const defaultConfig = config || makeConfig()
    const isDataMessage = (message: any) =>
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
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message: any) => {
        return isDataMessage(message)
      },
      toResponse: (message: any) => {
        const data = message[0].data[1]
        const result = data[6]
        return Requester.success('1', { data: { ...message[0], result } }, defaultConfig.verbose)
      },
      saveOnConnectToConnection: (message: any) => {
        return {
          id: message[0].id,
          clientId: message[0].clientId,
        }
      },
      modifySubscriptionPayload: (original, _, connectionParams) => {
        original[0].clientId = connectionParams.clientId
        original[0].id = connectionParams.id
        return original
      },
      shouldModifyPayload: (payload) => isDataSubscriptionMsg(payload),
      shouldSaveToConnection: (message: any) => {
        return !!message[0].clientId
      },
      shouldSaveToStore: (subscriptionMessage: any) => isDataSubscriptionMsg(subscriptionMessage),
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
            channel: '/meta/connect',
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
            channel: '/meta/connect',
            connectionType: 'websocket',
            clientId: prevWsResponse[0].clientId || connectionParams.clientId,
          },
        ],
      ],
    }
  }
}
