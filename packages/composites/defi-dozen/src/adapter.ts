import { Validator } from '@chainlink/ea-bootstrap'
import { Execute, ExecuteWithConfig, Config } from '@chainlink/types'
import { makeConfig } from './config'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

const getSymbols = async (): Promise<any> => {
  const symbols = await import(`./symbols/symbols.json`)
  console.log(symbols)
  return symbols
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const allocation = Object.keys(await getSymbols())
  const _execute = TokenAllocation.makeExecute()
  console.log(config)
  return await _execute({ id: jobRunID, data: { ...input.data, allocation } }, context)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
