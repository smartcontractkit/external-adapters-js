import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

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

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  let endpoint = validator.validated.data.endpoint
  if (commonKeys[symbol]) {
    endpoint = commonKeys[symbol].endpoint
    symbol = commonKeys[symbol].id
  }
  const url = `https://fcsapi.com/api-v3/${endpoint}`
  const access_key = util.getRandomRequiredEnv('API_KEY') // eslint-disable-line camelcase

  const params = {
    access_key,
    id: symbol,
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['response', 0, 'c'])
  return Requester.success(jobRunID, response)
}
