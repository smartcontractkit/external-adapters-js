import { AdapterRequest } from '@chainlink/types'
import { pick, omit } from 'lodash'
import objectHash from 'object-hash'

/** Common keys within adapter requests that should be ignored to generate a stable key*/
export const excludableAdapterRequestProperties: Record<string, true> = [
  'id',
  'maxAge',
  'meta',
  'debug',
  'rateLimitMaxAge',
  'metricsMeta',
]
  .concat((process.env.CACHE_KEY_IGNORED_PROPS || '').split(',').filter((k) => k))
  .reduce((prev, next) => {
    prev[next] = true
    return prev
  }, {} as Record<string, true>)

/** Common keys within adapter requests that should be used to generate a stable key*/
export const includableAdapterRequestProperties: string[] = ['data'].concat(
  (process.env.CACHE_KEY_INCLUDED_PROPS || '').split(',').filter((k) => k),
)

/** Common keys within adapter requests that should be ignored within "data" to create a stable key*/
export const excludableInternalAdapterRequestProperties = [
  'resultPath', // TODO: this too?
  'overrides',
  'tokenOverrides',
  'includes',
]

export const getKeyData = (data: AdapterRequest) =>
  omit(
    pick(data, includableAdapterRequestProperties),
    excludableInternalAdapterRequestProperties.map((property) => `data.${property}`),
  )

export type HashMode = 'include' | 'exclude'
/**
 * Generates a key by hashing input data
 *
 * @param data Adapter request input data
 * @param hashOptions Additional configuration for the objectHash package
 * @param mode Which behavior to use:
 *    include (default) - hash only selected properties throwing out everything else
 *    exclude           - hash the entire data object after excluding certain properties
 *
 * @returns string
 */
export const hash = (
  data: AdapterRequest,
  hashOptions: Required<Parameters<typeof objectHash>>['1'],
  mode: HashMode = 'include',
): string => {
  return mode === 'include' || !data
    ? objectHash(getKeyData(data), hashOptions)
    : objectHash(data, getHashOpts())
}

export const getHashOpts = (): Required<Parameters<typeof objectHash>>['1'] => ({
  algorithm: 'sha1',
  encoding: 'hex',
  unorderedSets: false,
  respectType: false,
  respectFunctionProperties: false,
  respectFunctionNames: false,
  excludeKeys: (props: string) => excludableAdapterRequestProperties[props],
})
