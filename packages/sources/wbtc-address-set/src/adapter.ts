import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig } from './config'

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

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  const options = { ...config.api }
  const response = await Requester.request<APIMembersResponse>(options)

  const result = response.data.result
    .filter((member) => member.token === 'wbtc')
    .flatMap((member) => member.addresses)
    .filter((a) => a.chain === 'btc' && a.type == 'custodial' && a.balance)
    .map((a) => ({ ...a, coin: 'btc', chain: 'mainnet' }))

  const output = { ...response, data: { ...response.data, result } }
  return Requester.success(jobRunID, output, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
