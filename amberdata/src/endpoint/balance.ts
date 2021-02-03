import { balance } from '@chainlink/ea-factories'
import { Config } from '@chainlink/types'
import { Requester } from '@chainlink/external-adapter'
import { isChainType, isCoinType, BLOCKCHAINS } from '.'

export const Names = ['balance']

const getBalanceURI = (address: string) => `/api/v2/addresses/${address}/account-balances/latest`

const getBlockchainHeader = (chain?: string, coin?: string) => {
  const network = Requester.toVendorName(coin, BLOCKCHAINS)
  return `${network}-mainnet`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig: any = {
    ...config.api,
    url: getBalanceURI(account.address),
    headers: {
      ...config.api.headers,
      'x-amberdata-blockchain-id': getBlockchainHeader(account.chain, account.coin),
    },
  }

  const response = await Requester.request(reqConfig)
  return {
    payload: response.data,
    result: [{ ...account, balance: response.data.payload.value }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
