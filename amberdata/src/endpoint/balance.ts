import { makeBalance } from '@chainlink/ea-factories'
import { Config, Address, Account } from '@chainlink/types'
import { Requester } from '@chainlink/external-adapter'
import { isChainType, isCoinType, BLOCKCHAINS } from '.'

export const Name = 'balance'

const getBalanceURI = (address: string) => `/api/v2/addresses/${address}/account-balances/latest`

const getBlockchainHeader = (chain?: string, coin?: string) => {
  const network = Requester.toVendorName(coin, BLOCKCHAINS)
  if (chain === 'testnet' && network === 'ethereum') return 'ethereum-rinkeby'
  return `${network}-mainnet`
}

const getBalance = async (address: Address, config: Config) => {
  const reqConfig: any = {
    ...config.api,
    url: getBalanceURI(address.address),
  }
  reqConfig.headers['x-amberdata-blockchain-id'] = getBlockchainHeader(address.chain, address.coin)

  const response = await Requester.request(reqConfig)
  return {
    response: response.data,
    result: { ...address, balance: response.data.payload.value },
  }
}

const isSupported = (coin: string, chain: string) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => makeBalance({ ...config, getBalance, isSupported })
