import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config, Address, Account } from '@chainlink/types'
import { COINS, isCoinType, isChainType } from '.'

export const Name = 'balance'

// tovendor

const getBalanceURI = (addresses: string[], coin: string, chain: string) => {
  coin = Requester.toVendorName(coin, COINS)
  if (chain === 'testnet') coin = `${coin}-${chain}`
  return `/${coin}/addresses/balances?addresses=${addresses.join(',')}`
}

const getBatchBalance: balance.GetBatchBalance = async (
  [network, { result, addresses }],
  config,
) => {
  const [coin, chain] = network.split('-')
  const reqConfig: any = {
    ...config.api,
    url: getBalanceURI(addresses, coin, chain),
  }

  const response = await Requester.request(reqConfig)

  const toResultWithBalance = (r: Address) => {
    const balance = response.data.data[r.address]
    if (typeof balance !== 'number') return r
    return { ...r, balance }
  }
  const resultWithBalance: Account[] = result.map(toResultWithBalance)

  return {
    ...response.data,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) =>
  balance.make({ ...config, getBatchBalance, isSupported })
