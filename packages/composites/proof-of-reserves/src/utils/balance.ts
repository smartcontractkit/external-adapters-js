import type { Account, AdapterContext, AdapterResponse, Config } from '@chainlink/ea-bootstrap'
import { callAdapter, makeRequestFactory } from '.'

export const ETHEREUM_CL_INDEXER = 'ETHEREUM_CL_INDEXER'

export const adapterNamesV2 = {
  amberdata: 'AMBERDATA',
  bitcoinJsonRpc: 'BITCOIN_JSON_RPC',
  blockchainCom: 'BLOCKCHAIN_COM',
  blockchair: 'BLOCKCHAIR',
  btcCom: 'BTC_COM',
  cryptoapis: 'CRYPTOAPIS',
  sochain: 'SOCHAIN',
  ethBalance: 'ETH_BALANCE',
  adaBalance: 'ADA_BALANCE',
}

export const adapterNamesV3 = {
  polkadotBalance: 'POLKADOT_BALANCE',
  staderBalance: 'STADER_BALANCE',
  ethBeacon: 'ETH_BEACON',
  avalanchePlatform: 'AVALANCHE_PLATFORM',
  lotus: 'LOTUS',
  porIndexer: 'POR_INDEXER',
  tokenBalance: 'TOKEN_BALANCE',
  ceffu: 'CEFFU',
  viewFunctionMultiChain: 'VIEW_FUNCTION_MULTI_CHAIN',
}

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
    case adapterNamesV2.bitcoinJsonRpc:
      next = buildLocalBitcoinNodeRequest(input)
      break
    case adapterNamesV3.porIndexer:
      next = buildPorIndexerRequest(input, confirmations)
      break
    case adapterNamesV3.tokenBalance:
      next = buildTokenBalanceRequest(input, confirmations)
      break
    case adapterNamesV3.ceffu:
      next = buildCeffuRequest(input)
      break
    case adapterNamesV3.ethBeacon:
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
    case adapterNamesV3.staderBalance:
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
