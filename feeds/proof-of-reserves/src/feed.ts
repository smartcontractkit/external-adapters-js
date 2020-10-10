import { logger, Requester } from '@chainlink/external-adapter'
import reduceAdapter from '@chainlink/reduce'
import { getImpl as getProtocolImpl } from './protocol'
import { getImpl as getBalanceImpl } from './balance'
import { util } from '@chainlink/ea-bootstrap'

const throwOnError = (output: any) => {
  const { statusCode } = output
  if (statusCode < 200 || statusCode >= 400) throw output.error
  else return output
}

export const executeAsync = async (input: any) => {
  // Get address set for protocol
  const executeProtocol = getProtocolImpl({ type: process.env.PROTOCOL_ADAPTER_TYPE })
  let output: any = throwOnError(await executeProtocol(input))
  logger.debug('_onProtocol', { output })

  // Get balances for address set
  const executeBalance = getBalanceImpl({ type: process.env.BTC_BALANCE_ADAPTER_TYPE })
  input = {
    id: input.id,
    data: {
      result: output.data.result,
      dataPath: 'result',
      endpoint: 'balance',
      confirmations: 6,
    },
  }
  output = throwOnError(await executeBalance(input))
  logger.debug('_onBalance', { output })

  // Get reduce balances as total balance
  input = {
    id: input.id,
    data: {
      result: output.data.result,
      reducer: 'sum',
      initialValue: 0,
      dataPath: 'result',
      valuePath: 'balance',
    },
  }
  return throwOnError(await util.toAsync(reduceAdapter.execute, input))
}

export const execute = (input: any, callback: any): void => {
  executeAsync(input)
    .then((res: any) => callback(res.statusCode, res.data))
    .catch((err: Error) => callback(500, Requester.errored(err)))
}
