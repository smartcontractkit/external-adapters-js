import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['punks']

export interface ResponseSchema {
  success: boolean
  block: string
  value: string
}

export const inputParameters: InputParameters = {
  block: {
    required: true,
    description: 'The block number for which information is being queried',
    aliases: ['blockNumber', 'blockNum'],
    type: 'number',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const block = validator.validated.data.block
  const url = `/punks/${block}`

  const params = {
    api_key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['value'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
