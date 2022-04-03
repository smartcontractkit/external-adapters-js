import { balance } from '@chainlink/ea-factories'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory } from '@chainlink/types'
import { isChainType, isCoinType } from '../config'

export const supportedEndpoints = ['balance']

export const description = '[Address](https://btc.com/api-doc#Address)'

export const inputParameters = balance.inputParameters

const getBalanceURI = (address: string) => util.buildUrlPath('/v3/address/:address', { address })

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

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
