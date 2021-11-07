import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ALCHEMY' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)

  config.apiKey = util.getRequiredEnv('ALCHEMY_API_KEY')
  config.defaultEndpoint = 'tvl'
  return config
}
