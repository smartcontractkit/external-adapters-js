import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['common', 'forex', 'stock']

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

export const inputParameters: InputParameters = {
  base: {
    aliases: ['asset', 'from'],
    required: true,
    description: 'The base key',
    type: 'string',
  },
}

// TODO: Run tests with valid API Key, current API Key is expired.
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
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
    url: util.buildUrlPath(':endpoint', { endpoint }, '/'),
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['response', 0, 'c'])
  return Requester.success(jobRunID, Requester.withResult(response, result))
}
