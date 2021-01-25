import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'convert'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false,
  amount: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'convert'
  const url = `https://data.fixer.io/api/${endpoint}`
  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || 1
  const access_key = util.getRandomRequiredEnv('API_KEY') // eslint-disable-line camelcase

  const params = {
    from,
    to,
    amount,
    access_key,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data, ['result'])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
