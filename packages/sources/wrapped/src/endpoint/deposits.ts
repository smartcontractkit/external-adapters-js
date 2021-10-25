import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['deposits']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  symbol: ['symbol'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const url = `/deposits`

  const options = { ...config.api, url }
  const response = await Requester.request(options, customError)
  const addresses = response.data[symbol]
  const keys = Object.keys(response.data).join()

  if (!addresses) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'symbol' path, must be one of the following values: ${keys}`,
      statusCode: 400,
    })
  }

  response.data.result = addresses as string[]
  return Requester.success(jobRunID, Requester.withResult(response, addresses))
}
