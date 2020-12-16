import bcypher from 'blockcypher'
import { balance } from '@chainlink/ea-factories'
import { Config } from '@chainlink/types'
import { CoinType, ChainType, isCoinType, isChainType } from '.'

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

// rewrite chain id for bcypher
const getChainId = (coin: CoinType, chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
      return 'main'
    case 'testnet':
      return coin === 'btc' ? 'test3' : 'test'
  }
}

const getBalance: balance.GetBalance = async (account, config) => {
  const chainId = getChainId(account.coin as CoinType, account.chain as ChainType)
  const api = new bcypher(account.coin, chainId, config.apiKey)
  const params = { confirmations: config.confirmations }
  const _getAddrBal = (): Promise<AddressBalance> =>
    new Promise((resolve, reject) => {
      api.getAddrBal(account.address, params, (error: Error, body: AddressBalance) =>
        error ? reject(error) : resolve(body),
      )
    })

  const response = await _getAddrBal()

  return {
    payload: response,
    result: [{ ...account, balance: response.balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
