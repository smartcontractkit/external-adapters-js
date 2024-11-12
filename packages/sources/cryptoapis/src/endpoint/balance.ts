import { ethers } from 'ethers'
import { balance } from '@chainlink/ea-factories'
import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteFactory, AdapterData, InputParameters } from '@chainlink/ea-bootstrap'
import { isCoinType, isChainType, TESTNET_BLOCKCHAINS } from '../config'

export const supportedEndpoints = ['balance']

export const description =
  'https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/btc/index#btc-address-info-endpoint'

export type TInputParameters = AdapterData
export const inputParameters: InputParameters<TInputParameters> = balance.inputParameters

export interface ResponseSchema {
  payload: {
    address: string
    totalSpent: string
    totalReceived: string
    balance: string
    txi: number
    txo: number
    txsCount: number
    addresses: string[]
  }
}

const getBalanceURI = (address: string, chain: string, coin: string) => {
  if (chain === 'testnet') chain = Requester.toVendorName(coin, TESTNET_BLOCKCHAINS) || chain
  return util.buildUrlPath('/v1/bc/:coin/:chain/address/:address', { coin, chain, address })
}

const getBalance: balance.GetBalance = async (account, config) => {
  const options = {
    ...config.api,
    url: getBalanceURI(account.address, account.chain as string, account.coin as string),
  }

  const response = await Requester.request<ResponseSchema>(options)
  // Each BTC has 8 decimal places
  const balance = ethers.utils.parseUnits(response.data.payload.balance, 8).toString()

  return {
    payload: response.data,
    result: [{ ...account, balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
