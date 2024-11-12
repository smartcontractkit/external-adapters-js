import { balance } from '@chainlink/ea-factories'
import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteFactory, AdapterData, InputParameters } from '@chainlink/ea-bootstrap'
import { isChainType, isCoinType } from '../config'

export const supportedEndpoints = ['balance']

export const description = '[Address](https://btc.com/api-doc#Address)'

export type TInputParameters = AdapterData
export const inputParameters: InputParameters<TInputParameters> = balance.inputParameters

export interface ResponseSchema {
  data: {
    address: string
    received: number
    sent: number
    balance: number
    tx_count: number
    unconfirmed_tx_count: number
    unconfirmed_received: number
    unconfirmed_sent: number
    unspent_tx_count: number
    first_tx: string
    last_tx: string
  }
}

const getBalanceURI = (address: string) => util.buildUrlPath('/v3/address/:address', { address })

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig = {
    ...config.api,
    url: getBalanceURI(account.address),
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)

  return {
    payload: response.data,
    result: [{ ...account, balance: String(response.data.data.balance) }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
