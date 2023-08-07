import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['allocation']

export type TInputParameters = {
  source: string
}

const inputParameters: InputParameters<TInputParameters> = {
  source: {
    required: true,
  },
}

export const getSymbols = async (): Promise<Array<{ symbol: string }>> => {
  const symbols = await import(`../symbols/symbols.json`)
  return symbols.default
}

export const execute: ExecuteWithConfig<Config> = async (input, context, _) => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id
  const allocations = await getSymbols()
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}
