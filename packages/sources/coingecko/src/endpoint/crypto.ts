import { AdapterError, Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, AxiosResponse, AdapterRequest, EndpointPaths } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolsToIds } from '../util'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export const endpointPaths: EndpointPaths = {
  price: (input: AdapterRequest): string => {
    const validator = new Validator(input, inputParameters)
    if (validator.error) throw validator.error
    const quote = validator.validated.data.quote
    return `${quote.toLowerCase()}`
  },
  marketcap: (input: AdapterRequest): string => {
    const validator = new Validator(input, inputParameters)
    if (validator.error) throw validator.error
    const quote = validator.validated.data.quote
    return `${quote.toLowerCase()}_market_cap`
  },
}

const inputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
  endpoint: false
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse,
  path: string,
  idToSymbol: Record<string, string>,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data) {
    for (const quote in response.data[base]) {
      const symbol = idToSymbol?.[base]
      if (symbol) {
        const nonBatchInput = {
          ...request,
          data: { ...request.data, base: symbol.toUpperCase(), quote: quote.toUpperCase() },
        }
        const validated = new Validator(nonBatchInput, inputParameters)
        payload.push([
          { endpoint: request.data.endpoint, ...validated.validated.data },
          Requester.validateResultNumber(response.data, [
            base,
            path,
          ]),
        ])
      } else Logger.debug('WARNING: Symbol not found ', base)
    }
  }
  response.data.results = payload
  return Requester.success(jobRunID, response, true, ['base', 'quote'])
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint
  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  let idToSymbol = {}
  let ids = coinid
  if (!ids) {
    try {
      const coinIds = await getCoinIds(jobRunID)
      const symbols = Array.isArray(base) ? base : [base]
      idToSymbol = getSymbolsToIds(symbols, coinIds)
      ids = Object.keys(idToSymbol).join(',')
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = '/simple/price'
  const path: string = validator.validated.data.path

  const params = {
    ids,
    vs_currencies: Array.isArray(quote) ? quote.join(',') : quote,
    include_market_cap: endpoint === 'marketcap',
    x_cg_pro_api_key: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)

  if (Array.isArray(base) || Array.isArray(quote))
    return handleBatchedRequest(jobRunID, request, response, path, idToSymbol)

  response.data.result = Requester.validateResultNumber(response.data, [
    ids.toLowerCase(),
    path,
  ])

  return Requester.success(jobRunID, response, config.verbose, ['base', 'quote'], {
    endpoint: request.data.endpoint,
    ...validator.validated.data,
  })
}
