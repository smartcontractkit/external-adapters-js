import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, Override } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  overrides: false,
}

const overrideSymbol = (overrides: Override | undefined, symbol: string): string => {
  const newSymbol = overrides?.get(AdapterName.toLowerCase())?.get(symbol.toLowerCase())
  if (newSymbol) return newSymbol
  return symbol
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = overrideSymbol(validator.validated.data.overrides, validator.validated.data.base)
  const quote = validator.validated.data.quote
  const url = `exchangerate/${symbol.toUpperCase()}/${quote.toUpperCase()}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, ['rate'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
