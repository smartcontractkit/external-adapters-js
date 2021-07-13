import { ExecuteWithConfig, ExecuteFactory, Config} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig, DEFAULT_ENDPOINT } from './config'


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

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

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
    url: endpoint
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['c'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
