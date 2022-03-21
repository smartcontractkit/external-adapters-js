import { balance } from '@chainlink/ea-factories'
import { AdapterData, InputParameters, Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { getBaseURL, ChainType, isCoinType, isChainType } from '../config'

export const supportedEndpoints = ['balance']

export type TInputParameters = AdapterData
export const inputParameters: InputParameters<TInputParameters> = balance.inputParameters

const getBalanceURI = (address: string, confirmations: number) =>
  `/q/addressbalance/${address}?confirmations=${confirmations}`

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    baseURL: config.api?.baseURL || getBaseURL(account.chain as ChainType),
    url: getBalanceURI(account.address, config.confirmations as number),
  }

  const response = await Requester.request<number>(reqConfig)

  return {
    payload: response.data,
    result: [{ ...account, balance: String(response.data) }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
