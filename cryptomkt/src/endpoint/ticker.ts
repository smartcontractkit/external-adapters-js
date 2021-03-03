import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'ticker'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = NAME
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const field = validator.validated.data.field || 'last_price'
  const market = base + quote

  const params = { market }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['data', 0, field])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
