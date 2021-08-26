import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, RequestConfig } from '@chainlink/types'
import { adapters as CheckAdapters } from './check'
import { adapters as SourceAdapters } from './source'

export const DEFAULT_CHECK_THRESHOLD = 0
export const DEFAULT_ONCHAIN_THRESHOLD = 0

export type SourceRequestOptions = { [source: string]: RequestConfig }
export type CheckRequestOptions = { [check: string]: RequestConfig }

export type Config = BaseConfig & {
  sources: SourceRequestOptions
  checks: CheckRequestOptions
  api: any
}

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}
  for (const a of SourceAdapters) {
    const url = util.getURL(a.NAME.toUpperCase())
    if (url) {
      sources[a.NAME] = makeRequestOptions(prefix, url)
    }
  }
  const checks: CheckRequestOptions = {}
  for (const a of CheckAdapters) {
    const url = util.getURL(a.NAME.toUpperCase())
    if (url) {
      checks[a.NAME] = makeRequestOptions(prefix, url)
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
