import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['quote', 'price']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'asset', 'from'],
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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `/api/v3/quote/${symbol}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [0, 'price'])

  return Requester.success(jobRunID, response, config.verbose)
}
