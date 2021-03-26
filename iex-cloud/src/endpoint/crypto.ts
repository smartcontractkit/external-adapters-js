import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'crypto'

const customParams = {
  base: ['base', 'from', 'coin', 'asset', 'symbol'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const url = `crypto/${base.toUpperCase()}${quote.toUpperCase()}/quote`

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['latestPrice'])

  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
