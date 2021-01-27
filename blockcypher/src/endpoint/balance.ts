import bcypher from 'blockcypher'
import { balance } from '@chainlink/ea-factories'
import { Config, Account } from '@chainlink/types'
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

const getBalances: balance.GetBalances = async (accounts, config) => {
  const addresses = accounts.map((a) => a.address)
  const { coin, chain } = accounts[0]
  const chainId = getChainId(coin as CoinType, chain as ChainType)
  const api = new bcypher(coin, chainId, config.apiKey)
  const params = { confirmations: config.confirmations }
  const _getAddrBal = (): Promise<AddressBalance[]> =>
    new Promise((resolve, reject) => {
      api.getAddrBal(addresses.join(';'), params, (error: Error, body: AddressBalance[]) =>
        error ? reject(error) : resolve(body),
      )
    })

  const response = await _getAddrBal()

  const responseLookup: { [key: string]: AddressBalance } = {}
  response.forEach((a) => (responseLookup[a.address] = a))

  const toResultWithBalance = (acc: Account) => ({
    ...acc,
    balance: String(responseLookup[acc.address].final_balance),
  })
  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalances, isSupported })
