import { Logger } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  ExecuteFactory,
  Execute,
  AdapterResponse,
  AdapterContext,
} from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { makeConfig, makeOptions, getURL, DEFAULT_CONFIRMATIONS } from './config'
import { runProtocolAdapter } from './protocol'
import { Indexer, runBalanceAdapter } from './balance'
import { runReduceAdapter } from './reduce'

export const makeRequestFactory = (config: Config, prefix: string): Execute => async (
  input: AdapterRequest,
) =>
  (
    await Requester.request({
      ...config.api,
      method: 'post',
      url: getURL(prefix, true),
      data: input,
    })
  ).data as AdapterResponse

// Run, log, throw on error
export const callAdapter = async (
  execute: Execute,
  context: AdapterContext,
  input: AdapterRequest,
  tag: string,
): Promise<AdapterResponse> => {
  const output = await execute(input, context)
  Logger.debug(tag, { output })
  return output
}

const inputParams = {
  protocol: true,
  indexer: true,
  confirmations: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const paramOptions = makeOptions()
  const validator = new Validator(input, inputParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer: Indexer = validator.validated.data.indexer.toUpperCase()
  const confirmations = validator.validated.data.confirmations || DEFAULT_CONFIRMATIONS

  const protocolOutput = await runProtocolAdapter(jobRunID, context, protocol, input.data, config)
  const balanceOutput = await runBalanceAdapter(
    indexer,
    context,
    confirmations,
    config,
    protocolOutput,
  )
  const reduceOutput = await runReduceAdapter(indexer, context, balanceOutput)
  return reduceOutput
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
