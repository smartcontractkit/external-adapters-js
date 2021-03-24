import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
}

const presetTickers: { [ticker: string]: string } = {
  COMP: 'compound-governance-token',
  FNX: 'finnexus',
  UNI: 'uniswap',
  GRT: 'the-graph',
  LINA: 'linear',
}

const convertFromTicker = async (config: Config, ticker: string, coinId: string) => {
  if (typeof coinId !== 'undefined') return coinId.toLowerCase()

  // Correct common tickers that are misidentified
  if (ticker in presetTickers) {
    return presetTickers[ticker]
  }

  const url = '/coins/list'

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)

  const coin = response.data.find((x: any) => x.symbol.toLowerCase() === ticker.toLowerCase())

  if (typeof coin === 'undefined') {
    return undefined
  }

  return coin.id.toLowerCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const coinid = validator.validated.data.coinid
  const url = '/simple/price'
  const market = validator.validated.data.quote
  const coin = await convertFromTicker(config, symbol, coinid)

  const params = {
    ids: coin,
    vs_currencies: market,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [
    coin.toLowerCase(),
    market.toLowerCase(),
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
