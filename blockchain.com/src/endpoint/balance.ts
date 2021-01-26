import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config, Account } from '@chainlink/types'
import { getBaseURL } from '../config'
import { ChainType, isCoinType, isChainType } from '.'

export const Name = 'balance'

const getBalanceURI = (addresses: string[], confirmations: number) =>
  `/q/addressbalance/${addresses.map((a) => `${a}?confirmations=${confirmations}|`).join('')}`

const getBalances: balance.GetBalances = async (accounts, config) => {
  const addresses = accounts.map((a) => a.address)
  const { chain } = accounts[0]

  const options: any = {
    ...config.api,
    baseURL: config.api.baseURL || getBaseURL(chain as ChainType),
    url: getBalanceURI(addresses, config.confirmations as number),
  }

  const response = await Requester.request(options)

  const toResultWithBalance = (acc: Account) => ({ ...acc, balance: String(response.data) })

  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response.data,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalances, isSupported })
