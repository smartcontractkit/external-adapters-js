import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['reserves']

export interface ResponseSchema {
  addresses: string[]
  ethereum_supply: number
  currency: string
}

export const inputParameters: InputParameters = {
  token: ['token', 'asset', 'coin'],
  network: false,
  chainId: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const token = validator.validated.data.token
  const network = validator.validated.data.network || 'filecoin'
  const chainId = validator.validated.data.chainId || 'mainnet'
  const url = `/v1/tokens/${token.toLowerCase()}/reserves`

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = response.data.addresses.map((address) => ({ address, network, chainId }))

  const output = { ...response, data: { ...response.data, result } }

  return Requester.success(jobRunID, output, config.verbose)
}
