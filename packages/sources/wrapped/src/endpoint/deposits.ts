import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/types'

export const supportedEndpoints = ['deposits']

export interface ResponseSchema {
  [token: string]: Address[]
}

export type Address = {
  address: string
}

const customError = (data: any) => {
  return typeof data !== 'object'
}

export const inputParameters: InputParameters = {
  symbol: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const url = `/deposits`

  const options = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const addresses = response.data[symbol]

  if (!addresses) {
    const keys = Object.keys(response.data).join()
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'symbol' path, must be one of the following values: ${keys}`,
      statusCode: 400,
    })
  }

  const result = {
    coin: symbol,
    addresses: addresses.map((address: Address) => ({ address })),
  }

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result as AxiosResponse<Address[]>),
  )
}
