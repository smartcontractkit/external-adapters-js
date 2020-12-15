import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { isCoinType, isChainType, TESTNET_BLOCKCHAINS } from '.'

export const Name = 'balance'

const getBalanceURI = (address: string, chain: string, coin: string) => {
  if (chain === 'testnet') {
    const name = Requester.toVendorName(coin, TESTNET_BLOCKCHAINS)
    if (name) chain = name
  }
  return `/v1/bc/${coin}/${chain}/address/${address}`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    url: getBalanceURI(account.address, account.chain as string, account.coin as string),
  }
  const response = await Requester.request(reqConfig)
  return {
    ...response.data,
    result: { ...account, balance: response.data.payload.value },
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
