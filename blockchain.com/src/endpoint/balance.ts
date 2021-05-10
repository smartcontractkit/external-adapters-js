import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config, Account } from '@chainlink/types'
import { getBaseURL } from '../config'
import { ChainType, isCoinType, isChainType } from '.'

export const NAME = 'balance'

const getBalanceURI = (addresses: string[]) => `balance?active=${addresses.join(',')}`

const getBalances: balance.GetBalances = async (accounts, config) => {
  const addresses = accounts.map((a) => a.address)
  const { chain } = accounts[0]

  const options: any = {
    ...config.api,
    baseURL: config.api.baseURL || getBaseURL(chain as ChainType),
    url: getBalanceURI(addresses),
  }

  const response = await Requester.request(options)

  const toResultWithBalance = (acc: Account) => ({
    ...acc,
    balance: String(response.data[acc.address].final_balance),
  })

  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response.data,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalances, isSupported })
