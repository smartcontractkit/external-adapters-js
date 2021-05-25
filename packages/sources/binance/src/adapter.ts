import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory, MakeWSHandler, AdapterRequest } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, DEFAULT_WS_API_ENDPOINT } from './config'
import { ticker } from './endpoint'

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
    case ticker.NAME: {
      return await ticker.execute(request, config)
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
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return
    return {
      "method": subscribe ? 'SUBSCRIBE' : 'UNSUBSCRIBE',
      "params":
        [
          `${symbol}@miniTicker`,
        ],
      "id": 1
    }
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, ticker.customParams, {}, false)
    if (validator.error) return
    const symbol = validator.validated.data.base.toUpperCase()
    const convert = validator.validated.data.quote.toUpperCase()
    return `${symbol.toLowerCase()}${convert.toLowerCase()}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (!message.s) return undefined
        return getSubscription(`${message.s.toLowerCase()}`)
      },
      isError: (message: any) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: any) => message.e === '24hrMiniTicker',
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['c'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
