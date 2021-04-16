import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import IntrinioRealtime from 'intrinio-realtime'
import { AdapterRequest } from '@chainlink/types'
import { Config, makeConfig, PROVIDER_OPTIONS } from './config'

const prices: { [symbol: string]: { bid: number; ask: number } } = {}

const subscribe = (assets: string[], config: Config) => {
  const client = new IntrinioRealtime({
    api_key: config.key,
    provider: config.provider,
  })

  client.join(assets)

  client.onQuote((quote: any) => {
    // https://github.com/intrinio/intrinio-realtime-node-sdk
    // handle different responses from different providers
    switch (config.provider) {
      case PROVIDER_OPTIONS[1]: //quodd (untested data provider)
        prices[quote.ticker] = {
          bid: quote?.bid_price_4d || prices[quote.ticker].bid,
          ask: quote?.ask_price_4d || prices[quote.ticker].ask,
        }
        break
      case PROVIDER_OPTIONS[2]: //fxcm (untested data provider)
        prices[quote.code] = {
          bid: quote.bid_price,
          ask: quote.ask_price,
        }
        break
      case PROVIDER_OPTIONS[0]: //iex
      default:
        if (quote.type == 'last') return
        prices[quote.ticker] = {
          ...prices[quote.ticker],
          [quote.type]: quote.price,
        }
        break
    }
  })
}

export const startService = (config: Config): void => {
  const symbols = config.symbols.toUpperCase().split(',')
  subscribe(symbols, config)
}

const customParams = {
  base: ['base', 'from', 'asset'],
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const symbols = config.symbols.toUpperCase().split(',')
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base.toUpperCase()

  if (!symbols.includes(symbol))
    throw new AdapterError({
      jobRunID,
      message: `Requested ${symbol} not in SYMBOLS environment variable`,
    })

  const bid = Requester.validateResultNumber(prices, [symbol, 'bid'])
  const ask = Requester.validateResultNumber(prices, [symbol, 'ask'])
  const price = (bid + ask) / 2

  const response = {
    data: {
      result: price,
    },
    result: price,
    status: 200,
  }
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
