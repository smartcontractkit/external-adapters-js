import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  if (!config.addressesEndpoint) {
    throw new Error('The address list endpoint has not been configured for this adapter')
  }

  const options = { ...config.api, baseURL: config.addressesEndpoint }
  const response = await Requester.request<APIMembersResponse>(options)

  const result = response.data.result
    .filter((a) => a.type == 'custodial' && a.balance)
    .map((a) => ({ ...a, coin: 'btc', chain: 'mainnet' }))

  const output = { ...response, data: { ...response.data, result } }
  return Requester.success(jobRunID, output, config.verbose)
}
