import { AxiosResponse } from 'axios'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig } from './config'

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

type JobSpecRequest = { id: string }
type JobSpecResponse = { statusCode: number; data: Record<string, unknown> }

const inputParams = {}

// Export function to integrate with Chainlink node
export const execute = async (
  request: JobSpecRequest,
  config: Config,
): Promise<JobSpecResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const reqConfig = { ...config.api, url: '' }
  const out: AxiosResponse<APIMembersResponse> = Requester.request(reqConfig)

  const addresses = out.data.result
    .filter((member) => member.token === 'wbtc')
    .flatMap((member) => member.addresses)
    .filter((a) => a.chain === 'btc' && a.type == 'custodial' && a.balance)
    .map((a) => ({ ...a, coin: 'btc', chain: 'mainnet' }))

  return {
    statusCode: 200,
    data: Requester.success(jobRunID, {
      data: { response: out.data, result: addresses },
      result: addresses,
      status: 200,
    }),
  }
}

// Export function to integrate with Chainlink node
export const executeWithDefaults = async (request: JobSpecRequest): Promise<JobSpecResponse> => {
  const config: Config = getConfig()
  return await execute(request, config)
}
