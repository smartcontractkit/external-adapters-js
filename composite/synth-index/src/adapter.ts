import { Validator, Requester } from '@chainlink/external-adapter'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import snx from 'synthetix'
import Decimal from 'decimal.js'
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

type Allocations = {
  components: string[]
  units: string[]
}

const makeAllocations = (synth: Synth): Allocations => {
  const components = synth.index.map((i) => i.asset)
  const units = synth.index.map((i) => new Decimal(i.units).mul(1e18).toString())
  return { components, units }
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

  const allocations = makeAllocations(synth)

  const tokenAllocationExecute = TokenAllocation.makeExecute()

  return await tokenAllocationExecute({
    data: { ...input.data, ...allocations },
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
