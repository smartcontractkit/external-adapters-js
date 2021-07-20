import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, AdapterRequest, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolToId } from '../util'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

const buildPath = (path: string) => (request: AdapterRequest): string => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  const quote = validator.validated.data.quote
  return `quotes.${quote.toUpperCase()}.${path}`
}

export const endpointResultPaths = {
  crypto: buildPath('price'),
  marketcap: buildPath('marketcap'),
  price: buildPath('price'),
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    try {
      const coinIds = await getCoinIds(jobRunID)
      coin = await getSymbolToId(symbol, coinIds)
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = `v1/tickers/${coin.toLowerCase()}`
  const resultPath = validator.validated.data.resultPath

  const params = {
    quotes: quote.toUpperCase(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, resultPath)
  response.data.cost = 2

  return Requester.success(jobRunID, response, config.verbose)
}
