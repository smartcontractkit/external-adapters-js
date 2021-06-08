import { ExecuteWithConfig, ExecuteFactory, Config} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customError = (data: any) => {
  return data.msg !== 'Successfully'
}

const commonKeys: Record<string, Record<string, string>> = {
  AUD: { id: '13', endpoint: 'forex/latest' },
  CHF: { id: '466', endpoint: 'forex/latest' },
  EUR: { id: '1', endpoint: 'forex/latest' },
  GBP: { id: '39', endpoint: 'forex/latest' },
  JPY: { id: '1075', endpoint: 'forex/latest' },
  XAU: { id: '1984', endpoint: 'forex/latest' },
  XAG: { id: '1975', endpoint: 'forex/latest' },
  N225: { id: '268', endpoint: 'stock/indices_latest' },
  FTSE: { id: '529', endpoint: 'stock/indices_latest' },
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false,
}

// TODO: Run tests with valid API Key, current API Key is expired.
export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  let endpoint = validator.validated.data.endpoint
  if (commonKeys[symbol]) {
    endpoint = commonKeys[symbol].endpoint
    symbol = commonKeys[symbol].id
  }
  const access_key = util.getRandomRequiredEnv('API_KEY') // eslint-disable-line camelcase

  const params = {
    access_key,
    id: symbol,
  }

  const options = {
    ...config.api,
    params,
    baseUrl: config.api.baseURL,
    url: endpoint
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['response', 0, 'c'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
