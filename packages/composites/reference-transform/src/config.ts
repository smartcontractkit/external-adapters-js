import legos from '@chainlink/ea'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export type Config = {
  sources: { [name: string]: DefaultConfig }
}

export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'

export const makeConfig = (prefix = ''): Config => {
  const sources: { [name: string]: DefaultConfig } = {}
  for (const a of legos.sources) {
    const url = util.getEnv(ENV_DATA_PROVIDER_URL, a.toUpperCase())
    if (url) {
      const defaultConfig = Requester.getDefaultConfig(prefix)
      defaultConfig.api.baseURL = url
      defaultConfig.api.method = 'post'
      sources[a.toLowerCase()] = defaultConfig
    }
  }

  return {
    sources,
  }
}
