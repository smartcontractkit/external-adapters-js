import legos from '@chainlink/ea'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_NETWORK = 'ETHEREUM'

export type Config = {
  sources: { [name: string]: DefaultConfig }
}

export const makeConfig = (prefix = ''): Config => {
  const sources: { [name: string]: DefaultConfig } = {}
  for (const a of legos.sources) {
    const url = util.getURL(a.toUpperCase())
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
