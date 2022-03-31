import { Logger, util } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  Execute,
  AdapterResponse,
  AdapterContext,
  InputParameters,
} from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { makeOptions } from '../config'
import { runProtocolAdapter } from '../utils/protocol'
import { Indexer, runBalanceAdapter } from '../utils/balance'
import { runReduceAdapter } from '../utils/reduce'

export const supportedEndpoints = ['reserves']

const paramOptions = makeOptions()

export const makeRequestFactory =
  (config: Config, prefix: string): Execute =>
  async (input: AdapterRequest) =>
    (
      await Requester.request({
        ...config.api,
        method: 'post',
        url: util.getURL(prefix, true),
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

const inputParameters: InputParameters = {
  protocol: {
    required: true,
    type: 'string',
    description: 'The protocol external adapter to use',
    options: paramOptions.protocol,
  },
  indexer: {
    required: true,
    type: 'string',
    description: 'The indexer external adapter to use',
    options: paramOptions.indexer,
  },
  confirmations: {
    required: false,
    type: 'number',
    description:
      'The number of confirmations required for a transaction to be counted when getting an address balance',
    default: 6,
  },
  addresses: {
    required: false,
    type: 'array',
    description: 'An array of addresses to get the balance from, when `protocol` is set to `list`',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters, paramOptions)

  const jobRunID = validator.validated.jobRunID
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer: Indexer = validator.validated.data.indexer.toUpperCase()
  const confirmations = validator.validated.data.confirmations

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
