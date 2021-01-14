import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'balance'

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false,
  quantity: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'convert'
  const url = `https://api.1forge.com/${endpoint}`
  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const quantity = validator.validated.data.quantity || 1
  const apiKey = util.getRandomRequiredEnv('API_KEY')

  const params = {
    from,
    to,
    quantity,
    api_key: apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
