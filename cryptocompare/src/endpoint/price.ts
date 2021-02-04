import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'price'
  const url = `https://min-api.cryptocompare.com/data/${endpoint}`
  const fsym = validator.validated.data.base.toUpperCase()
  const tsyms = validator.validated.data.quote.toUpperCase()

  const params = {
    fsym,
    tsyms,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  if (process.env.API_KEY) {
    options.headers = {
      ...options.headers,
      authorization: `Apikey ${util.getRandomRequiredEnv('API_KEY')}`,
    }
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [tsyms])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
