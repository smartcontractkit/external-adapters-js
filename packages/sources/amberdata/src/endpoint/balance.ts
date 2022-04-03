import { Requester, util } from '@chainlink/ea-bootstrap'
import { balance } from '@chainlink/ea-factories'
import { Config, ExecuteFactory, RequestConfig } from '@chainlink/types'
import { BLOCKCHAINS, isChainType, isCoinType } from '../config'

export const supportedEndpoints = ['balance']

export const inputParameters = balance.inputParameters

export interface ResponseSchema {
  status: number
  title: string
  description: string
  payload: {
    address: { address: string }
    blockchainId: string
    blockNumber: string
    timestampNanoseconds: number
    value: string
    timestamp: string
  }
}

const getBalanceURI = (address: string) =>
  util.buildUrlPath('/api/v2/addresses/:address/account-balances/latest', { address })

const getBlockchainHeader = (coin?: string) => {
  const network = Requester.toVendorName(coin, BLOCKCHAINS)
  return `${network}-mainnet`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig: RequestConfig = {
    ...config.api,
    url: getBalanceURI(account.address),
    headers: {
      ...config.api.headers,
      'x-amberdata-blockchain-id': getBlockchainHeader(account.coin),
    },
  }
  const response = await Requester.request<ResponseSchema>(reqConfig)
  return {
    payload: response.data,
    result: [{ ...account, balance: response.data.payload.value }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
