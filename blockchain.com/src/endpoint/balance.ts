import { Requester } from '@chainlink/external-adapter'
import {
  Config,
  CoinType,
  ChainType,
  DEFAULT_CONFIRMATIONS,
  getBaseURL,
} from '../config'

export const Name = 'balance'

type Address = {
  address: string
  coin: CoinType
  chain?: ChainType
  balance?: number
}
type RequestData = {
  addresses: Address[]
  confirmations: number
}

const WARNING_NO_OPERATION =
  'No Operation: only btc main/test chains are supported by blockchain.com adapter'

const getBalanceURI = (address: string, confirmations: number) =>
  `/q/addressbalance/${address}?confirmations=${confirmations}`

const toBalances = async (
  config: Config,
  addresses: Address[],
  confirmations: number = DEFAULT_CONFIRMATIONS
): Promise<Address[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...addr, warning: WARNING_NO_OPERATION }

      if (!addr.chain) addr.chain = 'main'
      if (addr.chain !== 'main' && addr.chain !== 'test')
        return { ...addr, warning: WARNING_NO_OPERATION }

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(addr.chain),
        url: getBalanceURI(addr.address, confirmations),
      }

      return {
        ...addr,
        balance: (await Requester.request(reqConfig)).data,
      }
    })
  )

export const inputParams = {
  addresses: true,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const createRequest = async (
  config: Config,
  data: RequestData
): Promise<Address[]> =>
  await toBalances(config, data.addresses, data.confirmations)
