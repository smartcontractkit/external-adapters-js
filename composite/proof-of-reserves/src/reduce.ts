import reduce from '@chainlink/reduce-adapter'
import { AdapterResponse } from '@chainlink/types'
import { callAdapter } from './adapter'

// Get reduce balances as total balance
export const runReduceAdapter = async (input: AdapterResponse) => {
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
  return callAdapter(reduce.execute, next, '_onReduce')
}
