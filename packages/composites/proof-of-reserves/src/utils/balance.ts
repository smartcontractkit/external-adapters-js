import type {
  AdapterImplementation as v2AdapterImplementation,
  AdapterResponse,
  Config,
  Account,
  AdapterContext,
} from '@chainlink/ea-bootstrap'
import { makeRequestFactory, callAdapter } from '.'
import { Adapter as v3AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'

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
import * as ethBeacon from '@chainlink/eth-beacon-adapter'
import * as avalanchePlatform from '@chainlink/avalanche-platform-adapter'
import { adapter as polkadotBalance } from '@chainlink/polkadot-balance-adapter'
import { adapter as staderBalance } from '@chainlink/stader-balance-adapter'

// TODO: type
export const adaptersV2: v2AdapterImplementation[] = [
  amberdata as unknown as v2AdapterImplementation,
  bitcoinJsonRpc as unknown as v2AdapterImplementation,
  porIndexer as unknown as v2AdapterImplementation,
  blockchainCom as unknown as v2AdapterImplementation,
  blockcypher as unknown as v2AdapterImplementation,
  blockchair as unknown as v2AdapterImplementation,
  btcCom as unknown as v2AdapterImplementation,
  cryptoapis as unknown as v2AdapterImplementation,
  sochain as unknown as v2AdapterImplementation,
  lotus as unknown as v2AdapterImplementation,
  ethBalance as unknown as v2AdapterImplementation,
  adaBalance as unknown as v2AdapterImplementation,
  ethBeacon as unknown as v2AdapterImplementation,
  avalanchePlatform as unknown as v2AdapterImplementation,
]

export const adaptersV3: v3AdapterImplementation[] = [
  polkadotBalance as unknown as v3AdapterImplementation,
  staderBalance as unknown as v3AdapterImplementation,
]

// Get balances for address set
export const runBalanceAdapter = async (
  indexer: string,
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
    case ethBeacon.NAME:
      next = {
        id: input.jobRunID,
        data: {
          result: input.data.result,
          dataPath: 'result',
          endpoint: 'balance',
          confirmations,
          validatorStatus: input.data.validatorStatus,
          searchLimboValidators: input.data.searchLimboValidators,
        },
      }
      break
    case staderBalance.name:
      next = {
        id: input.jobRunID,
        data: {
          result: input.data.result,
          dataPath: 'result',
          endpoint: 'balance',
          confirmations,
          validatorStatus: input.data.validatorStatus,
          elRewardAddresses: input.data.elRewardAddresses,
          socialPoolAddresses: input.data.socialPoolAddresses,
          penaltyAddress: input.data.penaltyAddress,
          poolFactoryAddress: input.data.poolFactoryAddress,
          stakeManagerAddress: input.data.stakeManagerAddress,
          permissionedPoolAddress: input.data.permissionedPoolAddress,
          staderConfigAddress: input.data.staderConfigAddress,
          reportedBlock: input.data.reportedBlock,
          network: input.data.network,
          chainId: input.data.chainId,
        },
      }
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
      // TODO: validate and type coerce
      scanobjects: (input.data.result as any).map((result: Account) => result.address),
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
