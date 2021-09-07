import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'

export const supportedEndpoints = ['members']

type APIMembersResponse = {
  result: Member[]
  count: number
}

type Member = {
  id: string
  token: string
  tags: string[]
  name: string
  addresses: Address[]
  description: string
  merchantPortalUri?: string
  websiteUri?: string
}

type Address = {
  address: string
  verified: boolean
  type: AddressType
  date: string
  chain: ChainType
  balance?: number
}

type AddressType = 'custodial' | 'merchant' | 'deposit'
type ChainType = 'btc' | 'eth'

const inputParams = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  if (!config.membersEndpoint) {
    throw new Error('The member list endpoint has not been configured for this adapter')
  }

  const options = { ...config.api, baseURL: config.membersEndpoint }
  const response = await Requester.request<APIMembersResponse>(options)

  const result = response.data.result
    .filter((member) => member.token === 'wbtc')
    .flatMap((member) => member.addresses)
    .filter((a) => a.type == 'custodial' && a.balance)
    .map((a) => ({ ...a, coin: 'btc', chain: 'mainnet' }))

  const output = { ...response, data: { ...response.data, result } }
  return Requester.success(jobRunID, output, config.verbose)
}
