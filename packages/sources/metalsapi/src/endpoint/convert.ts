import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert', 'price']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  amount: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || 1
  const url = `convert`

  console.log('FROM', from)

  const params = {
    access_key: config.apiKey,
    from,
    to,
    amount,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  return Requester.success(jobRunID, response, config.verbose)
}
