import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { TEClient } from 'tradingeconomics-stream'
import { AdapterRequest } from '@chainlink/types'
import { Config, makeConfig } from './config'

const prices: { [symbol: string]: number } = {}

const subscribe = (asset: string, config: Config) => {
  const client: any = new TEClient({
    ...config,
    reconnect: true,
  })

  client.subscribe(asset)

  client.on('message', (msg: any) => {
    console.log(`Got price for asset ${asset}:`, msg.price)
    prices[asset] = msg.price
  })
}

export const startService = (config: Config): void => {
  const symbols = config.symbols.split(',')
  for (let i = 0; i < symbols.length; i++) {
    const symbol = commonSymbols[symbols[i]]
    subscribe(symbol, config)
  }
}

const customParams = {
  base: ['base', 'from', 'asset'],
}

const commonSymbols: { [symbol: string]: string } = {
  N225: 'NKY:IND',
  FTSE: 'UKX:IND',
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (symbol in commonSymbols) {
    symbol = commonSymbols[symbol]
  }

  const price = Number(prices[symbol])
  if (price > 0) {
    const response = {
      data: {
        result: price,
      },
      result: price,
      status: 200,
    }
    return Requester.success(jobRunID, response)
  }

  // Fall back to getting the data from HTTP endpoint
  const url = `https://api.tradingeconomics.com/markets/symbol/${symbol}`

  const params = {
    c: `${config.key}:${config.secret}`,
  }

  const response = await Requester.request({ url, params })
  if (!response.data || response.data.length < 1) {
    throw new Error('no result for query')
  }
  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  response.data.result = Requester.validateResultNumber(response.data, ['Last'])
  prices[symbol] = response.data.result
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
