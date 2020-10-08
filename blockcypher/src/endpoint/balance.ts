import bcypher from 'blockcypher'
import objectPath from 'object-path'

import { Config, DEFAULT_CONFIRMATIONS, DEFAULT_DATA_PATH } from '../config'
import { JobSpecRequest } from '../adapter'
import { CoinType, ChainType } from '.'

export const Name = 'balance'

// blockcypher response type for addr balance query
type AddressBalance = {
  address: string
  total_received: number
  total_sent: number
  balance: number
  unconfirmed_balance: number
  final_balance: number
  n_tx: number
  unconfirmed_n_tx: number
  final_n_tx: number
}

type Address = {
  address: string
  coin?: CoinType
  chain?: ChainType
  balance?: number
}

type RequestData = {
  dataPath: string
  confirmations: number
}

const WARNING_NO_OPERATION =
  'No Operation: only btc mainnet/testnet chains are supported by blockcypher adapter'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

// rewrite chain id for bcypher
const getChainId = (coin: CoinType, chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
      return 'main'
    case 'testnet':
      return coin === 'btc' ? 'test3' : 'test'
  }
}

const toBalances = async (
  config: Config,
  addresses: Address[],
  confirmations: number = DEFAULT_CONFIRMATIONS,
): Promise<Address[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.address) return { ...addr, warning: WARNING_NO_OPERATION_MISSING_ADDRESS }

      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...addr, warning: WARNING_NO_OPERATION }

      if (!addr.chain) addr.chain = 'mainnet'
      if (addr.chain !== 'mainnet' && addr.chain !== 'testnet')
        return { ...addr, warning: WARNING_NO_OPERATION }

      const chainId = getChainId(addr.coin, addr.chain)
      const api = new bcypher(addr.coin, chainId, config.apiKey)
      const params = { confirmations }
      const _getAddrBal = (): Promise<AddressBalance> =>
        new Promise((resolve, reject) => {
          api.getAddrBal(addr.address, params, (error: Error, body: AddressBalance) =>
            error ? reject(error) : resolve(body),
          )
        })

      return {
        ...addr,
        balance: (await _getAddrBal()).balance,
      }
    }),
  )

export const inputParams = {
  dataPath: false,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const execute = async (
  config: Config,
  request: JobSpecRequest,
  data: RequestData,
): Promise<Address[]> => {
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw Error(`Input, at '${dataPath}' path, must be a non-empty array.`)

  return await toBalances(config, inputData, data.confirmations)
}
