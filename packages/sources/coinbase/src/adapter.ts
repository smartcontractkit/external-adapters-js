import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import { crypto } from './endpoint'
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

interface Message {
  type: string
  trade_id: number
  sequence: number
  time: string
  product_id: string
  price: string
  side: string
  last_size: string
  best_bid: string
  best_ask: string
}

export const makeWSHandler = (
  config?: Config,
): MakeWSHandler<
  Message | any // TODO: full WS message types
> => {
  const getSubscription = (productId?: string, subscribe = true) => {
    if (!productId) return ''
    return {
      type: subscribe ? 'subscribe' : 'unsubscribe',
      channels: ['ticker'],
      product_ids: [productId],
    }
  }
  const getProductId = (input: AdapterRequest) => {
    const validator = new Validator(input, crypto.inputParameters, {}, { shouldThrowError: false })
    if (validator.error) return ''
    const symbol = validator.validated.data.symbol.toUpperCase()
    const convert = validator.validated.data.convert.toUpperCase()
    return `${symbol}-${convert}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getProductId(input)),
      unsubscribe: (input) => getSubscription(getProductId(input), false),
      subsFromMessage: (message: Message) => getSubscription(`${message?.product_id}`),
      isError: (message: Message) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: Message) => message.type === 'ticker',
      toResponse: (message: Message) => {
        const result = Requester.validateResultNumber(message, ['price'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
