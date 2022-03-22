import legos from '@chainlink/ea'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config, RequestConfig } from '@chainlink/types'

export const DEFAULT_CHECK_THRESHOLD = 0
export const DEFAULT_ONCHAIN_THRESHOLD = 0
export const DEFAULT_NETWORK = 'ETHEREUM'
export const NAME = 'OUTLIER_DETECTION'
export const DEFAULT_ENDPOINT = 'outlier'

export type SourceRequestOptions = { [source: string]: RequestConfig }
export type CheckRequestOptions = { [check: string]: RequestConfig }
export interface ExtendedConfig extends Config {
  sources: SourceRequestOptions
  checks: CheckRequestOptions
  api: Record<string, unknown>
}

export const makeConfig = (prefix = ''): ExtendedConfig => {
  const sources: SourceRequestOptions = {}
  const checks: CheckRequestOptions = {}
  for (const a of legos.sources) {
    const url = util.getURL(a.toUpperCase())
    if (url) {
      sources[a] = makeRequestOptions(prefix, url)
      checks[a] = makeRequestOptions(prefix, url)
    }
  }
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    sources,
    checks,
    api: {},
  }
}

export const makeRequestOptions = (prefix: string, url: string): RequestConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig.api,
    method: 'post',
    url,
  }
}

export const makeOptions = ({ sources, checks }: ExtendedConfig) => {
  return {
    source: util.permutator(
      Object.keys(sources).map((value) => value.toLowerCase()),
      ',',
    ),
    check: util.permutator(
      Object.keys(checks).map((value) => value.toLowerCase()),
      ',',
    ),
  }
}
