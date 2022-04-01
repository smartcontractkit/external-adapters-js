import legos from '@chainlink/ea'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config, AxiosRequestConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'OUTLIER_DETECTION'
export const DEFAULT_ENDPOINT = 'outlier'

export type SourceRequestOptions = { [source: string]: AxiosRequestConfig }
export type CheckRequestOptions = { [check: string]: AxiosRequestConfig }
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

export const makeRequestOptions = (prefix: string, url: string): AxiosRequestConfig => {
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
