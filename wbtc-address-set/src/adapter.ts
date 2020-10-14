import { AxiosResponse } from 'axios'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config, getConfig, logConfig } from './config'

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
export const execute = async (
  request: AdapterRequest,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  logConfig(config)

  const jobRunID = validator.validated.id

  const reqConfig = { ...config.api }
  const out: AxiosResponse<APIMembersResponse> = await Requester.request(reqConfig)

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
export const executeWithDefaults = async (request: AdapterRequest): Promise<AdapterResponse> =>
  execute(request, getConfig())
