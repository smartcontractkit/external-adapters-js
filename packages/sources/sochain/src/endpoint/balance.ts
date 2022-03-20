import { ethers } from 'ethers'
import { balance } from '@chainlink/ea-factories'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Account, Config, ExecuteFactory } from '@chainlink/types'
import { isCoinType, isChainType } from '../config'

export const supportedEndpoints = ['balance']

export const inputParameters = balance.inputParameters

interface ResponseSchema {
  status: string
  data: {
    network: string
    address: string
    confirmed_balance: string
    unconfirmed_balance: string | null
  }
}

const getBalanceURI = (account: Account, confirmations: number) => {
  account.coin = account.coin?.toUpperCase()
  if (account.chain === 'testnet') account.coin = account.coin + 'TEST'
  return util.buildUrlPath('/api/v2/get_address_balance/:coin/:address/:confirmations', {
    coin: account.coin,
    address: account.address,
    confirmations,
  })
}

const getBalance: balance.GetBalance = async (account, config) => {
  const options = {
    ...config.api,
    url: getBalanceURI(account, config.confirmations as number),
  }

  const response = await Requester.request<ResponseSchema>(options)
  // Each BTC has 8 decimal places
  const balance = ethers.utils.parseUnits(response.data.data.confirmed_balance, 8).toString()

  return {
    payload: response.data,
    result: [{ ...account, balance }],
    status: response.status,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported })
