import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
export const NAME = 'property-details'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  property_id: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { property_id } = validator.validated.data
  const url = `properties/details.json`

  const params = {
    property_id,
    api_key: process.env.API_KEY || config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data.analytics, ['avm'])

  return Requester.success(jobRunID, {
    data: response.data.result,
    result: response.data.result,
    status: 200,
  })
}
