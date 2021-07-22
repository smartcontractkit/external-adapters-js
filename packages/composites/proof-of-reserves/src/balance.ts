import {
  AdapterImplementation,
  AdapterResponse,
  Config,
  Account,
  AdapterContext,
} from '@chainlink/types'
import { callAdapter, makeRequestFactory } from './adapter'
// balance adapters
import amberdata from '@chainlink/amberdata-adapter'
import bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import blockchainCom from '@chainlink/blockchain.com-adapter'
import blockchair from '@chainlink/blockchair-adapter'
import blockcypher from '@chainlink/blockcypher-adapter'
import btcCom from '@chainlink/btc.com-adapter'
import cryptoapis from '@chainlink/cryptoapis-adapter'
import sochain from '@chainlink/sochain-adapter'

export const adapters: AdapterImplementation[] = [
  amberdata,
  bitcoinJsonRpc,
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
  context: AdapterContext,
  confirmations: number,
  config: Config,
  input: AdapterResponse,
): Promise<AdapterResponse> => {
  const execute = makeRequestFactory(config, indexer)
  const next =
    indexer === bitcoinJsonRpc.NAME
      ? buildLocalBitcoinNodeRequest(input)
      : {
          id: input.jobRunID,
          data: {
            result: input.data.result,
            dataPath: 'result',
            endpoint: 'balance',
            confirmations,
          },
        }
  return callAdapter(execute, context, next, '_onBalance')
}

const buildLocalBitcoinNodeRequest = (input: AdapterResponse) => {
  return {
    id: input.jobRunID,
    data: {
      scanobjects: input.data.result.map((result: Account) => result.address),
      endpoint: 'scantxoutset',
    },
  }
}
