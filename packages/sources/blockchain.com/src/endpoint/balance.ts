import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory } from '@chainlink/types'
import { getBaseURL, ChainType, isCoinType, isChainType } from '../config'

export const supportedEndpoints = ['balance']

const getBalanceURI = (address: string, confirmations: number) =>
  `/q/addressbalance/${address}?confirmations=${confirmations}`

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL || getBaseURL(account.chain as ChainType),
    url: getBalanceURI(account.address, config.confirmations as number),
  }

  const response = await Requester.request(reqConfig)

  return {
    payload: response.data,
    result: [{ ...account, balance: String(response.data) }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute:ExecuteFactory<Config> = (config?: Config) =>  balance.make({ ...config, getBalance, isSupported })
