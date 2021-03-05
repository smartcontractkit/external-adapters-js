import reduceAdapter from '@chainlink/reduce-adapter'
import { AdapterResponse, Config } from '@chainlink/types'
import { callAdapter, makeRequestFactory } from './adapter'

// Get reduce balances as total balance
export const runReduceAdapter = async (config: Config, input: AdapterResponse) => {
  const execute = makeRequestFactory(config, reduceAdapter.NAME)
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
  return callAdapter(execute, next, '_onReduce')
}
