import { AdapterImplementation, AdapterResponse, Config } from '@chainlink/types'
import { callAdapter, makeRequestFactory } from './adapter'
// balance adapters
import amberdata from '@chainlink/amberdata-adapter'
import blockchainCom from '@chainlink/blockchain.com-adapter'
import blockchair from '@chainlink/blockchair-adapter'
import blockcypher from '@chainlink/blockcypher-adapter'
import btcCom from '@chainlink/btc.com-adapter'
import cryptoapis from '@chainlink/cryptoapis-adapter'
import sochain from '@chainlink/sochain-adapter'

export const adapters: AdapterImplementation[] = [
  amberdata,
  blockchainCom,
  blockcypher,
  blockchair,
  btcCom,
  cryptoapis,
  sochain,
]

export type Indexer = typeof adapters[number]['NAME']

// Get balances for address set
export const runBalanceAdapter = async (
  indexer: Indexer,
  confirmations: number,
  config: Config,
  input: AdapterResponse,
) => {
  const execute = makeRequestFactory(config, indexer)
  const next = {
    id: input.jobRunID,
    data: {
      result: input.data.result,
      dataPath: 'result',
      endpoint: 'balance',
      confirmations,
    },
  }
  return callAdapter(execute, next, '_onBalance')
}
