import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { DEFAULT_INTERVAL, DEFAULT_LIMIT } from '../config'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'eod'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  interval: false,
  limit: false,
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbols = validator.validated.data.base.toUpperCase()
  const interval = validator.validated.data.interval || DEFAULT_INTERVAL
  const limit = validator.validated.data.limit || DEFAULT_LIMIT
  const url = `eod`

  const params = {
    symbols,
    interval,
    limit,
    access_key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data, ['data', 0, 'close'])

  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
