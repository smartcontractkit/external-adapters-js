import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const customParams = {
  symbol: ['base', 'from', 'symbol'],
  to: false,
}

const commonKeys: Record<string, string> = {
  FTSE: 'UK100',
  N225: 'JPN225',
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://marketdata.tradermade.com/api/v1/live'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const to = (validator.validated.data.to || '').toUpperCase()
  const currency = (commonKeys[symbol] || symbol) + to

  const params = {
    currency,
    api_key: util.getRandomRequiredEnv('API_KEY'),
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, response)
}
