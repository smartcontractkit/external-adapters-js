import { logger } from '@chainlink/external-adapter'
import {
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  ExecuteFactory,
  Execute,
} from '@chainlink/types'
import { Validator, Requester } from '@chainlink/external-adapter'
import { makeConfig, makeOptions, getURL } from './config'
import { runProtocolAdapter } from './protocol'
import { runBalanceAdapter } from './balance'
import { runReduceAdapter } from './reduce'

export const makeRequestFactory = (config: Config, prefix: string) => async (
  input: AdapterRequest,
) => Requester.request({ ...config.api, method: 'post', url: getURL(prefix, true), data: input })

// Run, log, throw on error
export const callAdapter = async (execute: Execute, input: AdapterRequest, tag: string) => {
  const output = await execute(input)
  logger.debug(tag, { output })
  return output
}

const inputParams = {
  protocol: true,
  indexer: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const paramOptions = makeOptions()
  const validator = new Validator(input, inputParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer = validator.validated.data.indexer.toUpperCase()

  const protocolOutput = await runProtocolAdapter(jobRunID, protocol, input.data, config)
  const balanceOutput = await runBalanceAdapter(indexer, config, protocolOutput)
  const reduceOutput = await runReduceAdapter(balanceOutput)
  return reduceOutput
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
