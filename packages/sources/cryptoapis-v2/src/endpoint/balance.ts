import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { isCoinType, isChainType, TESTNET_BLOCKCHAINS, BLOCKCHAIN_NAME_MAP } from '.'

export const Name = 'balance'

const getBalanceURI = (address: string, chain: string, coin: string) => {
  if (chain === 'testnet') chain = Requester.toVendorName(coin, TESTNET_BLOCKCHAINS) || chain
  return `/v2/blockchain-data/${coin}/${chain}/addresses/${address}`
}

const getBalance: balance.GetBalance = async (account, config) => {
  if (!account.coin) {
    throw new Error(`Account ${account.address} is missing blockchain parameter`)
  }
  const coin = BLOCKCHAIN_NAME_MAP[account.coin.toLowerCase()]
  const options = {
    ...config.api,
    url: getBalanceURI(account.address, account.chain as string, coin as string),
  }
  const response = await Requester.request(options)
  const balance = response.data.data.item.confirmedBalance.amount

  return {
    payload: response.data,
    result: [{ ...account, balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
