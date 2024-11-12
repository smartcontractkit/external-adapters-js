import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['collections']

export interface ResponseSchema {
  success: boolean
  block: number
  value: number
}

export type TInputParameters = { collection: string }
export const inputParameters: InputParameters<TInputParameters> = {
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
  const url = `/api/v1/collections/${collection}/values/latest`

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
