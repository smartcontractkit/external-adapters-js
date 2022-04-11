import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['quote', 'common']

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

export interface ResponseSchema {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['quote', 'asset', 'from'],
    required: true,
    description: 'The base key',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || config.defaultEndpoint

  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const token = util.getRandomRequiredEnv('API_KEY')

  const params = {
    symbol,
    token,
  }

  const options = {
    ...config.api,
    params,
    url: util.buildUrlPath(':endpoint', { endpoint }, ':^'),
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['c'])
  return Requester.success(jobRunID, Requester.withResult(response, result))
}
