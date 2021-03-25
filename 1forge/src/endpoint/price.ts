import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, Override } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  overrides: false,
  quantity: false,
}

const overrideSymbol = (overrides: Override | undefined, symbol: string): string => {
  const newSymbol = overrides?.get(AdapterName.toLowerCase())?.get(symbol.toLowerCase())
  if (newSymbol) return newSymbol.toUpperCase()
  return symbol.toUpperCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/convert`
  const to = validator.validated.data.quote.toUpperCase()
  const from = overrideSymbol(validator.validated.data.overrides, validator.validated.data.base)
  const quantity = validator.validated.data.quantity || 1

  const params = {
    ...config.api.params,
    from,
    to,
    quantity,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
