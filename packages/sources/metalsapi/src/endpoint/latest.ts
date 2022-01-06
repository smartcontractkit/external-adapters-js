import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['latest']
export const batchablePropertyPath = [{ name: 'quote' }]

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  amount: false,
}

export interface ResponseSchema {
  success: true
  timestamp: string
  date: string
  base: string
  rates: {
    [key: string]: number
  }
  unit: string
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  symbols: string[],
) => {
  const payload: [AdapterRequest, number][] = []
  for (const symbol of symbols) {
    const from = response.data.base
    payload.push([
      {
        ...request,
        data: { ...request.data, base: from.toUpperCase(), quote: symbol.toUpperCase() },
      },
      Requester.validateResultNumber(response.data, [resultPath, symbol]),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote
  const url = `latest`

  const params = {
    access_key: config.apiKey,
    from,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  if (Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'rates', to)

  const result = Requester.validateResultNumber(response.data, ['rates', to])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
