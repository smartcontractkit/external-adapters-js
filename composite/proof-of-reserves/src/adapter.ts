import { logger } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse, ExecuteWithDefaults } from '@chainlink/types'
import reduceAdapter from '@chainlink/reduce'
import { getImpl as getProtocolImpl, getProtocol } from './protocol'
import { getImpl as getBalanceImpl, getBitcoinIndexer } from './balance'

// Run, log, throw on error
const runAdapter = async (execute: ExecuteWithDefaults, input: AdapterRequest, tag: string) => {
  const output = await execute(input)
  logger.debug(tag, { output })
  return output
}

// Get address set for protocol
const runProtocolAdapter = async (input: AdapterRequest) => {
  const execute = getProtocolImpl({ type: getProtocol() })
  return runAdapter(execute, input, '_onProtocol')
}

// Get balances for address set
const runBalanceAdapter = async (input: AdapterResponse) => {
  const execute = getBalanceImpl({ type: getBitcoinIndexer() })
  const next = {
    id: input.jobRunID,
    data: {
      result: input.data.result,
      dataPath: 'result',
      endpoint: 'balance',
      confirmations: 6,
    },
  }
  return runAdapter(execute, next, '_onBalance')
}

// Get reduce balances as total balance
const runReduceAdapter = async (input: AdapterResponse) => {
  const execute = reduceAdapter.execute
  const next = {
    id: input.jobRunID,
    data: {
      result: input.data.result,
      reducer: 'sum',
      initialValue: 0,
      dataPath: 'result',
      valuePath: 'balance',
    },
  }
  return runAdapter(execute, next, '_onReduce')
}

export const execute: ExecuteWithDefaults = async (input) => {
  const protocolOutput = await runProtocolAdapter(input)
  const balanceOutput = await runBalanceAdapter(protocolOutput)
  const reduceOutput = await runReduceAdapter(balanceOutput)
  return reduceOutput
}
