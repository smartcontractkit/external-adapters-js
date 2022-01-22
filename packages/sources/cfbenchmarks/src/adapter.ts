import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { AUTHORIZATION_HEADER, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  type: 'subscribe' | 'unsubscribe' | 'value'
  id: string
  value: string
  time: number
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getId = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.values.inputParameters)
    if (validator.error) return
    return validator.overrideSymbol(NAME, validator.validated.data.index) as string
  }
  const getSubscription = (type: 'subscribe' | 'unsubscribe', id?: string) => {
    if (!id) return
    return { type, id, stream: 'value', cacheID: id } // Temporarily add another key named cacheID that won't be ignored when generating the subscription key in getSubsID
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL,
        protocol: {
          headers: { [AUTHORIZATION_HEADER]: defaultConfig.api.headers[AUTHORIZATION_HEADER] },
        },
      },
      subscribe: (input) => getSubscription('subscribe', getId(input)),
      unsubscribe: (input) => getSubscription('unsubscribe', getId(input)),
      subsFromMessage: (message: Message) => getSubscription('subscribe', `${message?.id}`),
      isError: (message: { success: boolean }) => 'success' in message && !message.success,
      filter: (message: Message) => {
        return message.type === 'value'
      },
      toResponse: (message: Message) => {
        const result = Requester.validateResultNumber(message, ['value'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
