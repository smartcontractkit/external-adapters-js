import { AxiosResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { AdapterResponseInvalidError, Requester, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['crypto']

export type TInputParameters = { currency: string }
export const inputParameters: InputParameters<TInputParameters> = {
  currency: {
    aliases: ['base', 'from', 'coin', 'symbol'],
    description: 'The symbol of the currency to query',
    required: true,
  },
}

export interface ResponseSchema {
  jsonrpc: string
  result: number[][]
  usIn: number
  usOut: number
  usDiff: number
  testnet: boolean
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const currency = validator.validated.data.currency

  const params = { currency }
  const requestConfig = {
    ...config.api,
    params,
    url: 'get_historical_volatility',
  }

  const response: AxiosResponse = await Requester.request<ResponseSchema>(requestConfig)
  const result: number[][] = response.data['result']
  const resultSorted = result.sort((a, b) => {
    if (a.length < 1 || b.length < 1) return 1
    if (a[0] < b[0]) return 1
    if (a[0] > b[0]) return -1
    return 0
  })

  if (resultSorted.length < 1 || resultSorted[0].length < 2) {
    throw new AdapterResponseInvalidError({ jobRunID, message: 'no derbit value' })
  }

  response.data.result = Requester.validateResultNumber(resultSorted[0], [1])
  return Requester.success(jobRunID, response)
}
