import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { 
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosResponse,
  AdapterRequest
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'crypto', 'stock', 'forex']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'market'],
}

const quoteEventSymbols: { [key: string]: boolean } = {
  'USO/USD:AFX': true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const symbol = Array.isArray(base)
    ? base.map((symbol) => symbol.toUpperCase()).join(',')
    : (validator.overrideSymbol(AdapterName) as string).toUpperCase()

  const events = quoteEventSymbols[symbol] ? 'Quote' : 'Trade'
  const url = 'events.json'

  const params = {
    events,
    symbols: symbol,
  }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request(options, customError)

  if(Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, response, events)
  }

  const quotePath = ['Quote', symbol, 'bidPrice']
  const tradePath = ['Trade', symbol, 'price']
  response.data.result = Requester.validateResultNumber(
    response.data,
    events === 'Quote' ? quotePath : tradePath,
  )
  return Requester.success(jobRunID, response, config.verbose)
}

const handleBatchedRequest = (
  jobRunID: string,
  response: AxiosResponse,
  events: string
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data[events]) {
    const info = response.data[events][base]
    payload.push(info)
    Requester.validateResultNumber(response.data, [events, base, 'price'])
  }
  response.data.result = payload
  return Requester.success(jobRunID, response, true)
}
