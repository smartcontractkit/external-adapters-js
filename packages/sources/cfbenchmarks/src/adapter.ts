import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { AUTHORIZATION_HEADER, Config, makeConfig } from './config'
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

// interface Message {
//   type: 'subscribe' | 'unsubscribe' | 'value'
//   id: string
//   value: string
//   time: number
// }

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getId = (input: AdapterRequest) => {
    const validator = new Validator<endpoints.TInputParameters>(
      input,
      endpoints.values.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return
    return endpoints.values.getIdFromInputs(config || makeConfig(), validator, false)
  }
  const getSubscription = (type: 'subscribe' | 'unsubscribe', id?: string) => {
    if (!id) return ''
    return { type, id, stream: 'value', cacheID: id } // Temporarily add another key named cacheID that won't be ignored when generating the subscription key in getSubsID
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.ws?.baseWsURL,
        protocol: {
          headers: {
            [AUTHORIZATION_HEADER]: (defaultConfig.api as any).headers[AUTHORIZATION_HEADER],
          },
        } as any,
      },
      subscribe: (input) => getSubscription('subscribe', getId(input)),
      unsubscribe: (input) => getSubscription('unsubscribe', getId(input)),
      subsFromMessage: (message: any) => getSubscription('subscribe', `${message?.id}`),
      isError: (message: any) => 'success' in message && !message.success,
      filter: (message: any) => {
        return message.type === 'value'
      },
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['value'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
