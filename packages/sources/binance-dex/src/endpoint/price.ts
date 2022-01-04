import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { DEFAULT_DATA_ENDPOINT } from '../config'

const customError = (data: any) => data.length < 1

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_DATA_ENDPOINT
  const url = `/api/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const symbol = `${base}_${quote}`

  const params = {
    symbol,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)

  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  const lastUpdate = response.data.closeTime
  const curTime = new Date()
  // If data is older than 10 minutes, discard it
  if (lastUpdate < curTime.setMinutes(curTime.getMinutes() - 10))
    throw new AdapterError({
      jobRunID,
      message: `Data is too old`,
      statusCode: 500,
    })

  response.data.result = Requester.validateResultNumber(response.data, ['lastPrice'])

  return Requester.success(jobRunID, response, config.verbose)
}
