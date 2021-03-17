import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config, Account } from '@chainlink/types'
import { COINS, isCoinType, isChainType } from '.'

export const Name = 'balance'

const getBalanceURI = (addresses: string[], coin: string, chain: string) => {
  coin = Requester.toVendorName(coin, COINS)
  if (chain === 'testnet') coin = `${coin}-${chain}`
  return `/${coin}/addresses/balances?addresses=${addresses.join(',')}`
}

const getBalances: balance.GetBalances = async (accounts, config) => {
  const { coin, chain } = accounts[0]
  const addresses = accounts.map((a) => a.address)

  const reqConfig: any = {
    ...config.api,
    url: getBalanceURI(addresses, coin as string, chain as string),
  }

  const response = await Requester.request(reqConfig)

  const toResultWithBalance = (acc: Account) => {
    // NOTE: Blockchair does not return 0 balances
    const balance = String(response.data.data[acc.address] ?? 0)
    return { ...acc, balance }
  }
  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response.data,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalances, isSupported })
