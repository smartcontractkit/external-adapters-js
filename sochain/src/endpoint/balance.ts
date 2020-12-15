import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { isCoinType, isChainType } from '.'

export const Name = 'balance'

const getBalanceURI = (network: string, address: string, confirmations: number, chain: string) => {
  network = network.toUpperCase()
  if (chain === 'testnet') network = network + 'TEST'
  return `/api/v2/get_address_balance/${network}/${address}/${confirmations}`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    url: getBalanceURI(
      account.coin as string,
      account.address,
      config.confirmations,
      account.chain as string,
    ),
  }

  const response = await Requester.request(reqConfig)

  return {
    ...response.data,
    result: { ...account, balance: response.data.data.confirmed_balance },
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
