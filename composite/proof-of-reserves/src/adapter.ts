import { logger } from '@chainlink/external-adapter'
import reduceAdapter from '@chainlink/reduce'
import { getImpl as getProtocolImpl } from './protocol'
import { getImpl as getBalanceImpl } from './balance'

const throwOnError = (output: any) => {
  const { statusCode } = output
  if (statusCode < 200 || statusCode >= 400) throw output.error
  else return output
}

// Run, log, throw on error
const runAdapter = async (execute: any, input: any, tag: string) => {
  const output = throwOnError(await execute(input))
  logger.debug(tag, { output })
  return output
}

// Get address set for protocol
const runProtocolAdapter = async (input: any) => {
  const execute = getProtocolImpl({ type: process.env.PROTOCOL_ADAPTER })
  return runAdapter(execute, input, '_onProtocol')
}

// Get balances for address set
const runBalanceAdapter = async (input: any) => {
  const execute = getBalanceImpl({ type: process.env.BTC_BALANCE_ADAPTER })
  const next = {
    id: input.id,
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
const runReduceAdapter = async (input: any) => {
  const execute = reduceAdapter.execute
  const next = {
    id: input.id,
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

export const execute = async (input: any) => {
  const protocolOutput = await runProtocolAdapter(input)
  const balanceOutput = await runBalanceAdapter(protocolOutput)
  const reduceOutput = await runReduceAdapter(balanceOutput)
  return reduceOutput
}
