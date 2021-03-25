import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

const commonKeys: Record<string, string> = {
  N225: '^N225',
  FTSE: '^FTSE',
  XAU: 'OANDA:XAU_USD',
  XAG: 'OANDA:XAG_USD',
  AUD: 'OANDA:AUD_USD',
  EUR: 'OANDA:EUR_USD',
  GBP: 'OANDA:GBP_USD',
  // CHF & JPY are not supported
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  const url = `https://finnhub.io/api/v1/${endpoint}`
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const token = util.getRandomRequiredEnv('API_KEY')

  const params = {
    symbol,
    token,
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['c'])
  return Requester.success(jobRunID, response)
}
