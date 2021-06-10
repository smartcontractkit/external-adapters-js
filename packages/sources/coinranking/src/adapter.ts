import { ExecuteWithConfig, ExecuteFactory, Config} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const referenceSymbolToUuid = async (symbol: string, config: Config): Promise<string> => {
  const url = '/reference-currencies'
  const headers = {
    'x-access-token': util.getRandomRequiredEnv('API_KEY'),
  }
  const options = {
    baseUrl: config.api.baseURL,
    url,
    headers
  }

  const response = await Requester.request(options)
  const currency = response.data.data.currencies.find(
    (x: Record<string, unknown>) => (x['symbol'] as string).toLowerCase() === symbol.toLowerCase(),
  )
  if (!currency) throw Error(`Currency not found for symbol: ${symbol}`)
  return currency.uuid
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const referenceCurrencyUuid = await referenceSymbolToUuid(quote, config)

  const url = config.api.baseURL + `/coins`
  const params = {
    referenceCurrencyUuid,
    'symbols[]': base,
  }
  const headers = {
    'x-access-token': util.getRandomRequiredEnv('API_KEY'),
  }
  const options = {
    url,
    params,
    headers,
  }

  const response = await Requester.request(options)
  response.data = response.data.data.coins.find(
    (x: Record<string, unknown>) => (x['symbol'] as string).toLowerCase() === base.toLowerCase(),
  )
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
