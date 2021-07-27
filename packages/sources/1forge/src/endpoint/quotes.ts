import { Requester, Validator } from '@chainlink/ea-bootstrap'
//import { warmupStopped } from '@chainlink/ea-bootstrap/src/lib/cache-warmer/actions'
import { ExecuteWithConfig, Config, InputParameters, AdapterRequest, AxiosResponse } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['quotes']

export const inputParameters: InputParameters = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  quantity: false,
}
export interface ResponseSchema {
  data: string
}
const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<any>,
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const pair of response.data) {
    const base = pair['s'].split('/')[0]
    const quote = pair['s'].split('/')[1]
    payload.push([
      {
        ...request,
        data: { ...request.data, base: base.toUpperCase(), quote: quote.toUpperCase() },
      },
      Requester.validateResultNumber(pair, [resultPath]),
    ])

  }
  return Requester.success(jobRunID, Requester.withResult(response, undefined, payload), true, ['base', 'quote'])
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const url = `/quotes`
  const from = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote
  const pairArray = []

  for (const fromCurrency of formatArray(from)) {
    for (const toCurrency of formatArray(to)) {
      pairArray.push(`${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}`)
    }
  }
  const pairs = pairArray.toString()
  const params = {
    ...config.api.params,
    pairs,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)

  if (Array.isArray(from) || Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'a')

  response.data.result = Requester.validateResultNumber(response.data[0], ['a'])
  return Requester.success(jobRunID, response, config.verbose, ['base', 'quote'])
}

// format input as an array regardless of if it is a string or an array already
function formatArray(input: string | string[]) {
    let result = []
    if(typeof(input)==='string')
        result.push(input)
    else
        result = input
    return result
}
