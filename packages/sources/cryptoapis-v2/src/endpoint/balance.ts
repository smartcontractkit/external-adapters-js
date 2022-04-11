import { balance } from '@chainlink/ea-factories'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory } from '@chainlink/types'
import {
  isCoinType,
  isChainType,
  TESTNET_BLOCKCHAINS_BY_PLATFORM,
  BLOCKCHAIN_NAME_BY_TICKER,
  BlockchainTickers,
} from '../config'

export const supportedEndpoints = ['balance']

export const description =
  'https://developers.cryptoapis.io/technical-documentation/blockchain-data/unified-endpoints/get-address-details'

export const inputParameters = balance.inputParameters

interface ResponseSchema {
  apiVersion: string
  requestId: string
  data: {
    item: {
      transactionsCount: number
      confirmedBalance: {
        amount: string
        unit: string
      }
      totalReceived: {
        amount: string
        unit: string
      }
      totalSpent: {
        amount: string
        unit: string
      }
      incomingTransactionsCount: number
      outgoingTransactionsCount: number
    }
  }
}

const getBalanceURI = (address: string, chain: string, coin: string) => {
  if (chain === 'testnet')
    chain = Requester.toVendorName(coin, TESTNET_BLOCKCHAINS_BY_PLATFORM) || chain
  return util.buildUrlPath('/v2/blockchain-data/:coin/:chain/addresses/:address', {
    coin,
    chain,
    address,
  })
}

const getBalance: balance.GetBalance = async (account, config) => {
  if (!account.coin) {
    throw new Error(`Account ${account.address} is missing blockchain parameter`)
  }
  const coin = BLOCKCHAIN_NAME_BY_TICKER[account.coin.toLowerCase() as BlockchainTickers]
  const options = {
    ...config.api,
    url: getBalanceURI(account.address, account.chain as string, coin as string),
  }
  const response = await Requester.request<ResponseSchema>(options)
  const balance = response.data.data.item.confirmedBalance.amount

  return {
    payload: response.data,
    result: [{ ...account, balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
