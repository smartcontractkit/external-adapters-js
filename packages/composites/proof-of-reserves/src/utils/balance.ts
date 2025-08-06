import type {
  Account,
  AdapterContext,
  AdapterResponse,
  Config,
  AdapterImplementation as v2AdapterImplementation,
} from '@chainlink/ea-bootstrap'
import { Adapter as v3AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'
import { callAdapter, makeRequestFactory } from '.'

// balance adapters
import * as adaBalance from '@chainlink/ada-balance-adapter'
import * as amberdata from '@chainlink/amberdata-adapter'
import { adapter as avalanchePlatform } from '@chainlink/avalanche-platform-adapter'
import * as bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import * as blockchainCom from '@chainlink/blockchain.com-adapter'
import * as blockchair from '@chainlink/blockchair-adapter'
import * as blockcypher from '@chainlink/blockcypher-adapter'
import * as btcCom from '@chainlink/btc.com-adapter'
import { adapter as ceffu } from '@chainlink/ceffu-adapter'
import * as cryptoapis from '@chainlink/cryptoapis-adapter'
import * as ethBalance from '@chainlink/eth-balance-adapter'
import { adapter as ethBeacon } from '@chainlink/eth-beacon-adapter'
import { adapter as lotus } from '@chainlink/lotus-adapter'
import { adapter as polkadotBalance } from '@chainlink/polkadot-balance-adapter'
import { adapter as porIndexer } from '@chainlink/por-indexer-adapter'
import * as sochain from '@chainlink/sochain-adapter'
import { adapter as staderBalance } from '@chainlink/stader-balance-adapter'
import { adapter as tokenBalance } from '@chainlink/token-balance-adapter'
import { adapter as viewFunctionMultiChain } from '@chainlink/view-function-multi-chain-adapter'

export const ETHEREUM_CL_INDEXER = 'ETHEREUM_CL_INDEXER'

// TODO: type
export const adaptersV2: v2AdapterImplementation[] = [
  amberdata as unknown as v2AdapterImplementation,
  bitcoinJsonRpc as unknown as v2AdapterImplementation,
  blockchainCom as unknown as v2AdapterImplementation,
  blockcypher as unknown as v2AdapterImplementation,
  blockchair as unknown as v2AdapterImplementation,
  btcCom as unknown as v2AdapterImplementation,
  cryptoapis as unknown as v2AdapterImplementation,
  sochain as unknown as v2AdapterImplementation,
  ethBalance as unknown as v2AdapterImplementation,
  adaBalance as unknown as v2AdapterImplementation,
]

export const adaptersV3: v3AdapterImplementation[] = [
  polkadotBalance,
  staderBalance,
  ethBeacon,
  avalanchePlatform,
  lotus,
  porIndexer,
  tokenBalance,
  ceffu,
  viewFunctionMultiChain,
]

// Get balances for address set
export const runBalanceAdapter = async (
  indexer: string,
  context: AdapterContext,
  confirmations: number,
  config: Config,
  input: AdapterResponse,
  indexerEndpoint?: string,
  indexerParams?: Record<string, string>,
): Promise<AdapterResponse> => {
  const postfix = indexer == ETHEREUM_CL_INDEXER ? '/' + indexerEndpoint : ''
  const execute = makeRequestFactory(config, indexer, postfix)
  let next
  switch (indexer) {
    case bitcoinJsonRpc.NAME:
      next = buildLocalBitcoinNodeRequest(input)
      break
    case porIndexer.name:
      next = buildPorIndexerRequest(input, confirmations)
      break
    case tokenBalance.name:
      next = buildTokenBalanceRequest(input, confirmations)
      break
    case ceffu.name:
      next = buildCeffuRequest(input)
      break
    case ethBeacon.name:
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

  if (indexerEndpoint) {
    ;(next.data as any).endpoint = indexerEndpoint
  }

  for (const [key, value] of Object.entries(indexerParams || {})) {
    ;(next.data as any)[key] = value
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

function buildTokenBalanceRequest(input: AdapterResponse, minConfirmations: number) {
  return {
    id: input.jobRunID,
    data: {
      endpoint: 'evm',
      addresses: input.data.result,
      minConfirmations,
    },
  }
}

function buildCeffuRequest(input: AdapterResponse) {
  return {
    id: input.jobRunID,
    data: {
      addresses: input.data.result,
    },
  }
}
