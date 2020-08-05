import { AxiosResponse } from 'axios'
import { Requester, Validator } from '@chainlink/external-adapter'
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

type AddressType = string & ('custodial' | 'merchant' | 'deposit')
type ChainType = string & ('btc' | 'eth')

type JobSpecRequest = { id: string }
type Callback = (statusCode: number, data: Record<string, unknown>) => void

const inputParams = {}

const config: Config = getConfig()
logConfig(config)

// Export function to integrate with Chainlink node
export const createRequest = (
  request: JobSpecRequest,
  callback: Callback
): void => {
  const validator = new Validator(callback, request, inputParams)
  const jobRunID = validator.validated.id

  const _handleResponse = (out: AxiosResponse<APIMembersResponse>): void => {
    const addresses = out.data.result
      .flatMap((member) => member.addresses)
      .filter((a) => a.chain === 'btc' && a.type == 'custodial' && a.balance)

    callback(
      200,
      Requester.success(jobRunID, {
        data: { response: out.data, result: addresses },
        result: addresses,
        status: 200,
      })
    )
  }

  const _handleError = (err: Error): void =>
    callback(500, Requester.errored(jobRunID, err))

  const reqConfig = { ...config.api, url: '' }
  Requester.request(reqConfig).then(_handleResponse).catch(_handleError)
}
