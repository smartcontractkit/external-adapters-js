import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['latest', 'forex']
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
  const base = response.data.base.toUpperCase()
  for (const symbol of symbols) {
    payload.push([
      {
        ...request,
        data: { ...request.data, base, quote: symbol.toUpperCase() },
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
  const base = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote
  const url = `latest`
  if (Array.isArray(base))
    throw new AdapterError({
      jobRunID,
      message: `Base symbol ${base} is not batchable.`,
      statusCode: 400,
    })

  const params = {
    access_key: config.apiKey,
    base,
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
