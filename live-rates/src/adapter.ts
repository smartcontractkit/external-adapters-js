import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  symbol: ['base', 'from', 'symbol', 'rate'],
  to: false,
}

const commonKeys: Record<string, string> = {
  EURUSD: 'EURUSD',
  BTCEUR: 'BTCEUR'
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://live-rates.com/api/price'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const to = (validator.validated.data.to || '').toUpperCase()
  const rate = (commonKeys[symbol] || symbol) + to
  const key = process.env.API_KEY

  const params = {
    rate,
    key,
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, [0, 'rate'])
  return Requester.success(jobRunID, response)
}
