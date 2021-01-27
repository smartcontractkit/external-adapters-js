import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'conversion'

const customError = (data: any) => {
  return data.status === 'ERROR'
}

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  amount: false,
  precision: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const endpoint = `conversion`
  const amount = validator.validated.data.amount || 1
  const precision = validator.validated.data.precision || 4
  const apikey = util.getRandomRequiredEnv('API_KEY')
  const baseURL = `https://api.polygon.io/v1/${endpoint}/${from}/${to}`

  const params = {
    amount,
    precision,
    apikey,
  }

  const reqConfig = { ...config.api, params, baseURL }

  const { data } = await Requester.request(reqConfig)
  data.result = Requester.validateResultNumber(data, ['converted'])
  return Requester.success(jobRunID, {
    data,
    result: data.result,
    status: 200,
  })
}
