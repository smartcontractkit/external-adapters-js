import { Validator, Requester } from '@chainlink/external-adapter'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import {
  types,
  makeExecute as tokenAllocationMakeExecute,
} from '@chainlink/token-allocation-adapter'
import snx from 'synthetix'
import { makeConfig, Config } from './config'

const customParams = {
  asset: ['asset', 'from'],
  network: false,
}

type Synth = {
  name: string
  asset: string
  index: any[]
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

  const jobID = validator.validated.jobID
  const asset = validator.validated.data.asset.toLowerCase()
  const network = validator.validated.data.network || config.defaultNetwork

  const synths: Synth[] = snx.getSynths({ network: network.toLowerCase() })
  const synth = synths
    .filter(({ index, inverted }) => index && !inverted)
    .find((d) => d.name.toLowerCase() === asset)

  if (!synth) {
    return Requester.errored(jobID, new Error('Synth not found'))
  }

  const allocations = getAllocations(synth)
  const _execute = tokenAllocationMakeExecute()
  return await _execute({ id: validator.validated.id, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
