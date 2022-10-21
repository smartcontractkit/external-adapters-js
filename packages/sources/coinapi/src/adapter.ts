import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  DefaultConfig,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'
import { crypto } from './endpoint'

export const execute: ExecuteWithConfig<DefaultConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<DefaultConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<DefaultConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<DefaultConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<DefaultConfig, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler =
  (config?: DefaultConfig): MakeWSHandler =>
  () => {
    const defaultConfig = config || makeConfig()
    const getSubscription = (products: string[]) => ({
      type: 'hello',
      apikey: defaultConfig.apiKey,
      heartbeat: false,
      subscribe_data_type: ['exrate'],
      subscribe_filter_asset_id: products,
    })
    return {
      connection: {
        url: defaultConfig.ws.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => {
        const validator = new Validator(
          input,
          crypto.inputParameters,
          {},
          { shouldThrowError: false },
        )
        if (validator.error) return
        const base = validator.overrideSymbol(NAME, validator.validated.data.base).toLowerCase()

        // Casting quote to string for WS handler
        // Used as string[] only for batching
        const quote = validator
          .overrideSymbol(NAME, <string>validator.validated.data.quote)
          .toLowerCase()
        return getSubscription([base, quote])
      },
      unsubscribe: () => undefined,
      subsFromMessage: (
        message: any, // TODO: type WS message shape
      ) => getSubscription([message.asset_id_base, message.asset_id_quote]),
      isError: () => false,
      filter: (message: any) => message?.type === 'exrate', // TODO: type WS message shape
      toResponse: (message) => {
        const result = Requester.validateResultNumber(message, ['rate'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
