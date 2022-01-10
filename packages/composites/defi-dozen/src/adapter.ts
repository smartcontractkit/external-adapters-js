import { Validator } from '@chainlink/ea-bootstrap'
import { Execute, ExecuteWithConfig, Config } from '@chainlink/types'
import { makeConfig } from './config'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const getSymbols = async (): Promise<Array<{ symbol: string }>> => {
  const symbols = await import(`./symbols/symbols.json`)
  return symbols.default
}

export const execute: ExecuteWithConfig<Config> = async (input, context, _) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.jobRunID
  const allocations = await getSymbols()
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
