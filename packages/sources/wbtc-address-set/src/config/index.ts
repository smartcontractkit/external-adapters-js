import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'WBTC'

export const DEFAULT_ENDPOINT = 'addresses'

export const ENV_MEMBERS_ENDPOINT = 'MEMBERS_ENDPOINT'
export const ENV_ADDRESSES_ENDPOINT = 'ADDRESSES_ENDPOINT'

export type Config = BaseConfig & {
  membersEndpoint?: string
  addressesEndpoint?: string
}

export const makeConfig = (prefix = ''): Config => ({
  ...Requester.getDefaultConfig(prefix),
  defaultEndpoint: DEFAULT_ENDPOINT,
  membersEndpoint: util.getEnv(ENV_MEMBERS_ENDPOINT, prefix),
  addressesEndpoint: util.getEnv(ENV_ADDRESSES_ENDPOINT, prefix),
})
