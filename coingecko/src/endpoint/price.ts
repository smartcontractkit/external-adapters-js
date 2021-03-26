import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, Override } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

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

const getCoinId = async (config: Config, symbol: string): Promise<string> => {
  const url = '/coins/list'

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const coin = response.data.find((x: any) => x.symbol.toLowerCase() === symbol.toLowerCase())

  if (typeof coin === 'undefined') {
    throw new Error('Coin id not found')
  }

  return coin.id.toLowerCase()
}

const overrideSymbol = (overrides: Override | undefined, symbol: string): string | undefined => {
  return overrides?.get(AdapterName.toLowerCase())?.get(symbol.toLowerCase())
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const quote = validator.validated.data.quote
  const overrides = validator.validated.overrides as Override | undefined
  const coinid = validator.validated.data.coinid as string | undefined

  let coin = coinid?.toLowerCase() || overrideSymbol(overrides, symbol)
  if (!coin) {
    try {
      coin = await getCoinId(config, symbol)
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = '/simple/price'
  const params = {
    ids: coin,
    vs_currencies: quote,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [
    coin.toLowerCase(),
    quote.toLowerCase(),
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
