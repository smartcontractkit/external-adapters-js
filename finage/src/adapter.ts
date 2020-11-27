import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  symbol: ['base', 'from', 'symbol'],
  to: false,
}

const commonKeys: Record<string, string> = {
  FTSE: 'UK100',
  N225: 'JAP225',
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://api.finage.co.uk/last'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const to = (validator.validated.data.to || '').toUpperCase()
  const currencies = (commonKeys[symbol] || symbol) + to
  const apikey = process.env.API_KEY

  const params = {
    currencies,
    apikey,
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['currencies', 0, 'value'])
  return Requester.success(jobRunID, response)
}
