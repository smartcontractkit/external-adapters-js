import { AdapterConfigError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { PorInputAddress } from '@chainlink/proof-of-reserves-adapter/src/utils/PorInputAddress'

export const supportedEndpoints = ['addresses']

type APIMembersResponse = {
  result: Address[]
  count: number
}

type Address = {
  id: string
  address: string
  balance?: number
  type: AddressType
  verified: boolean
}

type AddressType = 'custodial' | 'merchant' | 'deposit'
export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  if (!config.addressesEndpoint) {
    throw new AdapterConfigError({
      jobRunID,
      statusCode: 500,
      message: 'The address list endpoint has not been configured for this adapter',
    })
  }

  const options = { ...config.api, baseURL: config.addressesEndpoint }
  const response = await Requester.request<APIMembersResponse>(options)

  const result = response.data.result
    .filter((a) => a.type == 'custodial' && a.balance)
    .map<PorInputAddress>((a) => ({ ...a, coin: 'btc', chainId: 'mainnet', network: 'bitcoin' }))

  const output = { ...response, data: { ...response.data, result } }
  return Requester.success(jobRunID, output, config.verbose)
}
