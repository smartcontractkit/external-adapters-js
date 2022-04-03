import {
  AdapterImplementation,
  AdapterResponse,
  Config,
  Account,
  AdapterContext,
} from '@chainlink/types'
import { callAdapter, makeRequestFactory } from '../endpoint/reserves'
// balance adapters
import * as amberdata from '@chainlink/amberdata-adapter'
import * as bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import * as porIndexer from '@chainlink/por-indexer-adapter'
import * as blockchainCom from '@chainlink/blockchain.com-adapter'
import * as blockchair from '@chainlink/blockchair-adapter'
import * as blockcypher from '@chainlink/blockcypher-adapter'
import * as btcCom from '@chainlink/btc.com-adapter'
import * as cryptoapis from '@chainlink/cryptoapis-adapter'
import * as sochain from '@chainlink/sochain-adapter'
import * as lotus from '@chainlink/lotus-adapter'
import * as ethBalance from '@chainlink/eth-balance-adapter'
import * as adaBalance from '@chainlink/ada-balance-adapter'

export const adapters: AdapterImplementation[] = [
  amberdata,
  bitcoinJsonRpc,
  porIndexer,
  blockchainCom,
  blockcypher,
  blockchair,
  btcCom,
  cryptoapis,
  sochain,
  lotus,
  ethBalance,
  adaBalance,
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
  let next
  switch (indexer) {
    case bitcoinJsonRpc.NAME:
      next = buildLocalBitcoinNodeRequest(input)
      break
    case porIndexer.NAME:
      next = buildPorIndexerRequest(input, confirmations)
      break
    default:
      next = {
        id: input.jobRunID,
        data: {
          result: input.data.result,
          dataPath: 'result',
          endpoint: 'balance',
          confirmations,
        },
      }
  }
  return callAdapter(execute, context, next, '_onBalance')
}

function buildLocalBitcoinNodeRequest(input: AdapterResponse) {
  return {
    id: input.jobRunID,
    data: {
      scanobjects: input.data.result.map((result: Account) => result.address),
      endpoint: 'scantxoutset',
    },
  }
}

function buildPorIndexerRequest(input: AdapterResponse, minConfirmations: number) {
  return {
    id: input.jobRunID,
    data: {
      addresses: input.data.result,
      minConfirmations,
    },
  }
}
