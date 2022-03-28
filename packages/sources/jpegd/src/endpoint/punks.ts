import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const description =
  "Queries JPEG'd API for the value of a floor Cryptopunk at the requested block."

export const supportedEndpoints = ['punks']

export interface ResponseSchema {
  success: boolean
  block: number
  value: number
}

export const inputParameters: InputParameters = {
  block: {
    required: false,
    description: 'The block number for which information is being queried',
    aliases: ['blockNumber', 'blockNum'],
    default: 'latest',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const block = validator.validated.data.block

  const badType = typeof block !== 'string' && typeof block !== 'number'
  const badString = typeof block === 'string' && block !== 'latest'

  if (badString || badType) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid block parameter ${block} provided.`,
      statusCode: 400,
    })
  }

  const url = `/punks`

  const params = {
    block: block,
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
