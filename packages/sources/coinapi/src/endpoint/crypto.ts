import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, AdapterRequest, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price']

export const endpointOverride = (request: AdapterRequest): string | null => {
  // The Assets endpoint supports batch requests, but only for USD quotes.
  // If possible, use it.
  const validator = new Validator(request, inputParameters)
  if (validator.validated.data.quote === 'USD') return 'assets'
  return null
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const url = `exchangerate/${symbol}/${quote}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['rate'])

  return Requester.success(jobRunID, response, config.verbose)
}
