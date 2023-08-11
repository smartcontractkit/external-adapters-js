import { AdapterDataProviderError, Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['stbt']

export interface ResponseSchema {
  accountName: string
  totalReserve: number
  totalToken: number
  timestamp: string
  ripcord: boolean
  ripcordDetails: string[]
}

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `STBT`
  const resultPath = validator.validated.data.resultPath

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)

  // Return error if ripcord indicator true
  if (response.data.ripcord) {
    const message = `Ripcord indicator true. Details: ${response.data.ripcordDetails.join(', ')}`
    throw new AdapterDataProviderError({
      message,
      statusCode: 502,
      errorResponse: {
        ripcord: response.data.ripcord,
        ripcordDetails: response.data.ripcordDetails,
      },
    })
  }

  const result = Requester.validateResultNumber(response.data, resultPath || 'totalReserve')

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
