import { Validator, AdapterError } from '@chainlink/external-adapter'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import {
  types,
  makeExecute as TAMakeExecute,
  makeConfig as TAMakeConfig,
} from '@chainlink/token-allocation-adapter'
import snx from 'synthetix'
import { makeConfig, Config } from './config'

const customParams = {
  base: ['base', 'asset', 'from'],
  network: false,
}

type Synth = {
  name: string
  asset: string
  index: {
    asset: string
    category: string
    units: number
  }[]
  inverted: Record<string, any>
}

const getAllocations = (synth: Synth): types.TokenAllocations => {
  return synth.index.map((index) => ({
    symbol: index.asset,
    balance: index.units,
    decimals: 0,
  }))
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const { base, network = config.defaultNetwork } = validator.validated.data

  const synths: Synth[] = snx.getSynths({ network: network.toLowerCase() })
  const synth = synths
    .filter(({ index, inverted }) => index && !inverted)
    .find((d) => d.name.toLowerCase() === base.toLowerCase())

  if (!synth) throw new AdapterError({ message: `Synth not found`, statusCode: 400 })

  const allocations = getAllocations(synth)
  const _execute = TAMakeExecute(TAMakeConfig(config.dataProvider))
  return await _execute({ id: validator.validated.id, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
