import { Requester } from '@chainlink/ea-bootstrap'
import { Config as ChainlinkConfig } from '@chainlink/types'

export const NAME = 'US_CENSUS'

export const DEFAULT_ENDPOINT = 'acs5_2019'

export const makeConfig = (prefix?: string): ChainlinkConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix, true)

  const config: ChainlinkConfig = {
    ...defaultConfig,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }

  return config
}
