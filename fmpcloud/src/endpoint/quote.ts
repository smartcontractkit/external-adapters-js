import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'quote'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false,
}

const commonKeys: { [key: string]: string } = {
  N225: '^N225',
  FTSE: '^FTSE',
  AUD: 'AUDUSD',
  CHF: 'CHFUSD',
  EUR: 'EURUSD',
  GBP: 'GBPUSD',
  JPY: 'JPYUSD',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://fmpcloud.io/api/v3/${endpoint}/${symbol}`
  const apikey = util.getRandomRequiredEnv('API_KEY')

  const params = {
    apikey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [0, 'price'])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
