import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory } from '@chainlink/types'
import { isChainType, isCoinType } from '../config'

export const supportedEndpoints = ['balance']

const getBalanceURI = (address: string) => `/v3/address/${address}`

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    url: getBalanceURI(account.address),
  }

  const response = await Requester.request(reqConfig)

  return {
    payload: response.data,
    result: [{ ...account, balance: String(response.data.data.balance) }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute:ExecuteFactory<Config> = (config?: Config) => balance.make({ ...config, getBalance, isSupported })
