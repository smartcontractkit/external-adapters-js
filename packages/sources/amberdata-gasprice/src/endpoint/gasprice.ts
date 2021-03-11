import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'gasprice'

const customError = (data: any) => {
  return Object.keys(data.payload).length < 1
}

const customParams = {
  speed: false,
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'average'
  const endpoint = validator.validated.data.endpoint || 'ethereum-mainnet'
  const url = '/api/v2/transactions/gas/predictions'

  const options = {
    ...config.api,
    url,
    headers: {
      ...config.api.headers,
      'x-amberdata-blockchain-id': endpoint,
    },
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [
    'payload',
    speed,
    'gasPrice',
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
