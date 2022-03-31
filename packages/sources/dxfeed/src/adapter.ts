import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import overrides from './config/symbols.json'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export type DXFeedMessage = {
  channel: string
  clientId?: string
  id: string
  data: [string, string[]]
  successful?: boolean
  advice?: {
    interval: number
    timeout: number
    reconnect: string
  }
}[]

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (request: 'subscribe' | 'unsubscribe', ticker?: string) => {
    if (!ticker) return ''
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
    const isDataMessage = (message: any) =>
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
        url: defaultConfig.ws?.baseWsURL,
      },
      subscribe: (input) => {
        const validator = new Validator(
          input,
          endpoints.price.inputParameters,
          {},
          { shouldThrowError: false, overrides },
        )
        if (validator.errored) throw validator.errored
        const ticker = validator.validated.data.base
        return getSubscription('subscribe', ticker as any)
      },
      unsubscribe: (input) => {
        const validator = new Validator(
          input,
          endpoints.price.inputParameters,
          {},
          { shouldThrowError: false, overrides },
        )
        if (validator.errored) throw validator.errored
        const ticker = validator.validated.data.base
        return getSubscription('unsubscribe', ticker as any)
      },
      subsFromMessage: (message: any) => {
        if (!message) {
          return ''
        }
        switch (message[0].channel) {
          case META_HANDSHAKE:
            return handshakeMsg
          case META_CONNECT:
            return heartbeatMsg
          case SERVICE_DATA:
            return getSubscription('subscribe', message[0].data[1][0])
          default:
            return ''
        }
      },
      isError: (message) => (message as any)[0].successful === false,
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
          requestId: parseInt(message[0].id),
          clientId: message[0].clientId,
        }
      },
      modifySubscriptionPayload: (original, _, connectionParams, id) => {
        const orig = original as Array<any>
        orig[0].clientId = (connectionParams as any).clientId
        orig[0].id = id.toString()
        return original
      },
      shouldModifyPayload: (payload) => {
        const p = payload as Array<any>
        return p[0].channel === META_CONNECT || p[0].channel === SERVICE_SUB
      },
      shouldSaveToConnection: (message: any) => {
        return !!message[0].clientId
      },
      shouldReplyToServerHeartbeat: (message) => {
        const dxFeedMsg = message as any
        return Object.keys(dxFeedMsg[0]).length === 3 && dxFeedMsg[0].channel === META_CONNECT
      },
      heartbeatReplyMessage: (message, _, connectionParams) => [
        {
          id: parseInt((message as any)[0].id) + 1,
          channel: META_CONNECT,
          connectionType: 'websocket',
          clientId: (connectionParams as any).clientId,
        },
      ],
      heartbeatIntervalInMS: 30000,
      shouldSaveToStore: (subscriptionMessage: any) => isDataSubscriptionMsg(subscriptionMessage),
      isOnConnectChainMessage: (message: any) =>
        message[0].channel === META_HANDSHAKE || message[0].channel === META_CONNECT,
      isDataMessage: (message) => isDataSubscriptionMsg(message as DXFeedMessage),
      onConnectChain: [
        {
          payload: handshakeMsg,
        },
        {
          payload: firstHeartbeatMsg,
          filter: (message: any) => message && message[0]?.id == '2',
        },
        {
          payload: heartbeatMsg,
          filter: (message: any) =>
            message &&
            (message[0].id === '3' ||
              (Object.keys(message[0]).length === 3 && message[0].channel === META_CONNECT)),
          shouldNeverUnsubscribe: true,
        },
      ],
    }
  }
}
