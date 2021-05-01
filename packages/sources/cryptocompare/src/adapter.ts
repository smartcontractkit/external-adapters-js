import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  Config,
  AdapterRequest,
} from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, NAME, DEFAULT_WS_API_ENDPOINT } from './config'
import { price, marketCap } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint.toLowerCase()) {
    case price.NAME: {
      return await price.execute(request, config)
    }
    case 'marketcap': {
      return await marketCap.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  // https://min-api.cryptocompare.com/documentation/websockets
  const subscriptions = {
    trade: 0,
    ticker: 2,
    aggregate: 5,
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, price.customParams)
    if (validator.error) return
    const base = validator.overrideSymbol(NAME).toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}~${quote}`
  }
  const getSubscription = (action: 'SubAdd' | 'SubRemove', pair?: string) => {
    if (!pair) return
    return { action, subs: [`${subscriptions.aggregate}~CCCAGG~${pair}`] }
  }
  const withApiKey = (url: string, apiKey: string) => `${url}?api_key=${apiKey}`
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: withApiKey(
          defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
          defaultConfig.apiKey || '',
        ),
        protocol: { query: { api_key: defaultConfig.apiKey } },
      },
      subscribe: (input) => getSubscription('SubAdd', getPair(input)),
      unsubscribe: (input) => getSubscription('SubRemove', getPair(input)),
      subsFromMessage: (message) =>
        getSubscription('SubAdd', `${message?.FROMSYMBOL}~${message?.TOSYMBOL}`),
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message) => {
        // Ignore everything is not from the wanted channels
        const code = Number(message.TYPE)
        const flag = Number(message.FLAGS) // flags = 4 (means price unchanged, PRICE parameter not included)
        return (code === subscriptions.ticker || code === subscriptions.aggregate) && flag !== 4
      },
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['PRICE'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
