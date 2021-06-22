import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import * as ta from '@chainlink/token-allocation-adapter'
import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import Decimal from 'decimal.js'
import snx from 'synthetix'
import { SetRequired } from 'type-fest'
import { Config, makeConfig } from './config'

const customParams = {
  base: ['base', 'asset', 'from'],
  network: false,
}

export interface Synth {
  name: string
  asset?: string
  index?: {
    asset: string
    category: string
    units: number
  }[]
  inverted?: Record<string, any>
}

export type SynthIndex = SetRequired<Synth, 'index'>
/**
 * Covert number to max number of decimals, trim trailing zeros
 *
 * @param num number to convert to fixed max number of decimals
 * @param decimals max number of decimals
 */
export function toFixedMax(num: Decimal.Value, decimals: number): string {
  return (
    new Decimal(num)
      .toFixed(decimals)
      // remove trailing zeros
      .replace(/(\.\d*?[1-9])0+$/g, '$1')
      // remove decimal part if all zeros (or only decimal point)
      .replace(/\.0*$/g, '')
  )
}

function getAllocations(synth: SynthIndex): ta.types.TokenAllocations {
  return synth.index.map((index) => {
    const decimals = 18
    const balanceDec = new Decimal(index.units).mul(10 ** decimals)
    const balance = toFixedMax(balanceDec, decimals)
    return { symbol: index.asset, balance, decimals }
  })
}

function isSynthIndex(synth: Synth | undefined): synth is SynthIndex {
  return !!(synth && synth.index)
}

/**
 * Get a synth index token on a particular ethereum network
 *
 * @param network The ethereum network to use
 * @param base The name of the index token to fetch
 */
export function getSynthIndexFor(network: string, base: string): SynthIndex | undefined {
  const synths: Synth[] = snx.getSynths({ network: network.toLowerCase() })
  const synth = synths
    .filter(({ index, inverted }) => index && !inverted)
    // executing a find here without checking if the array length is > 1 is fine here
    // since we know only one synth index token for a given name will exist per network
    .find((d) => d.name.toLowerCase() === base.toLowerCase())

  return isSynthIndex(synth) ? synth : undefined
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const { base, network = config.defaultNetwork } = validator.validated.data
  const synthIndex = getSynthIndexFor(network, base)
  if (!synthIndex) {
    throw new AdapterError({ message: `Index synth not found`, statusCode: 400 })
  }

  const allocations = getAllocations(synthIndex)
  const _execute = ta.makeExecute(config.taConfig)
  return await _execute({ id: validator.validated.id, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
