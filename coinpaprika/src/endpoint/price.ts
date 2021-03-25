import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, Override } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

const inputParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  overrides: false,
}

const getCoinId = async (ticker: string): Promise<string> => {
  const response = await Requester.request({
    url: 'https://api.coinpaprika.com/v1/coins',
  })
  const coin = response.data
    .sort((a: { rank: number }, b: { rank: number }) => (a.rank > b.rank ? 1 : -1))
    .find(
      (x: { symbol: string; rank: number }) =>
        x.symbol.toLowerCase() === ticker.toLowerCase() && x.rank !== 0,
    )
  if (typeof coin?.id === 'undefined') {
    throw new Error('Coin id not found')
  }
  return coin.id.toLowerCase()
}

const overrideSymbol = (overrides: Override | undefined, symbol: string): string | undefined => {
  return overrides?.get(AdapterName.toLowerCase())?.get(symbol.toLowerCase())
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const quote = validator.validated.data.quote
  const overrides = validator.validated.data.overrides as Override | undefined
  const coinid = validator.validated.data.coinid as string | undefined

  let coin = coinid || overrideSymbol(overrides, symbol)
  if (!coin) {
    try {
      coin = await getCoinId(symbol)
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  console.log('COIN:', coin)
  const url = `v1/tickers/${coin.toLowerCase()}`

  const params = {
    quotes: quote.toUpperCase(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [
    'quotes',
    quote.toUpperCase(),
    'price',
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
