import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config,  ExecuteWithConfig} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'example' // This should be filled in with a lowercase name corresponding to the API endpoint

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const url = `price`

  const params = {
    base,
    quote,
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])

  return Requester.success(jobRunID, response, config.verbose)
}
