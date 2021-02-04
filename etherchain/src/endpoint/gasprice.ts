import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'gasPriceOracle'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  speed: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = `/api/gasPriceOracle`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [speed]) * 1e9

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
