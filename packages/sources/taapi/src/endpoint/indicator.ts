import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['indicator']

export const inputParameters: InputParameters = {
  indicator: {
    required: true,
    description: 'The TA indicator to query',
  },
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The base currency in the market to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The quote currency in the market to query',
    type: 'string',
  },
  exchange: {
    required: true,
    description: 'The exchange to get data from',
  },
  interval: {
    required: true,
    description: 'The time interval to use',
  },
}

// TODO: Run tests with valid pro tier + API Key
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const indicator = validator.validated.data.indicator
  const url = indicator
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const symbol = `${base}/${quote}`
  const exchange = validator.validated.data.exchange
  const interval = validator.validated.data.interval
  const secret = util.getRandomRequiredEnv('API_KEY')

  const params = {
    secret,
    exchange,
    symbol,
    interval,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await HTTP.request(options)
  response.data.result = HTTP.validateResultNumber(response.data, ['value'])
  return HTTP.success(jobRunID, response)
}
