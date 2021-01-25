import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'ethgasAPI'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  speed: false,
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'ethgasAPI'
  const speed = validator.validated.data.speed || 'average'
  const url = `https://data-api.defipulse.com/api/v1/egs/api/${endpoint}.json?`

  const options = {
    ...config.api,
    url,
    params: {
      'api-key': util.getRandomRequiredEnv('API_KEY'),
    },
    timeout: 10000,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [speed]) * 1e8

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
