import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customError = (data: ResponseSchema) => {
  return data.msg !== 'Successfully'
}

export interface ResponseSchema {
  status: boolean
  code: string
  msg: string
  response: {
    c: string
    h: string
    l: string
    ch: string
    cp: string
    t: string
    name: string
    cty: string
    id: string
    tm: string
  }[]
  info: { server_time: string; credit_count: number }
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
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

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
    url: endpoint,
  }

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, ['response', 0, 'c'])
  return HTTP.success(jobRunID, HTTP.withResult(response, result))
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
