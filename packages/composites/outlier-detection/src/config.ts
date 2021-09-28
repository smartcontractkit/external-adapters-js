import legos from '@chainlink/ea'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, RequestConfig } from '@chainlink/types'

export const DEFAULT_CHECK_THRESHOLD = 0
export const DEFAULT_ONCHAIN_THRESHOLD = 0
export const DEFAULT_NETWORK = 'ETHEREUM'

export type SourceRequestOptions = { [source: string]: RequestConfig }
export type CheckRequestOptions = { [check: string]: RequestConfig }

export type Config = BaseConfig & {
  sources: SourceRequestOptions
  checks: CheckRequestOptions
  api: any
}

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}
  const checks: CheckRequestOptions = {}
  for (const a of legos.sources) {
    const url = util.getURL(a.toUpperCase())
    if (url) {
      sources[a] = makeRequestOptions(prefix, url)
      checks[a] = makeRequestOptions(prefix, url)
    }
  }
  return { sources, checks, api: {} }
}

export const makeRequestOptions = (prefix: string, url: string): RequestConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig.api,
    method: 'post',
    url,
  }
}

export const makeOptions = ({ sources, checks }: Config) => {
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
