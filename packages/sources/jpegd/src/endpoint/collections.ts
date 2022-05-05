import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['collections']

export interface ResponseSchema {
  success: boolean
  block: number
  value: number
}

export const inputParameters: InputParameters = {
  collection: {
    type: 'string',
    required: true,
    description: 'The Opensea slug of the collection being requested',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {})

  const jobRunID = validator.validated.id
  const collection = validator.validated.data.collection
  const url = `/api/v1/collections/values/${collection}/latest`

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
