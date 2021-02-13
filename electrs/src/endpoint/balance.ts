import { Account } from '@chainlink/types'
import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Script } from 'bcoin'
import { ElectrsConfig } from '../config'

export const NAME = 'balance'

export const getBalance: balance.GetBalance = async (account, config) => {
  const response = await queryBalance(account, config)
  const responseKey = config.confirmations || 6 >= 6 ? 'confirmed' : 'unconfirmed'
  const balance = String(response[responseKey])
  return {
    result: [
      {
        ...account,
        balance,
      },
    ],
    payload: [response],
  }
}

interface BalanceResponse {
  confirmed: number
  unconfirmed: number
}

const queryBalance = async (
  account: Account,
  config: balance.BalanceConfig,
): Promise<BalanceResponse> => {
  const reqConfig = {
    ...config.api,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      jsonrpc: '2.0',
      method: 'blockchain.scripthash.get_balance',
      params: {
        address: convertAddressToScriptHash(account.address),
      },
      id: '1',
    },
  }
  const response = await Requester.request(reqConfig)
  return response.data.result
}

export const convertAddressToScriptHash = (address: string): string => {
  const script = Script.fromAddress(address)
  const scriptHash = script.sha256()
  return scriptHash.reverse().toString('hex')
}

export const makeExecute = (config: ElectrsConfig) =>
  balance.make({
    ...config,
    getBalance,
    isSupported: (coin, chain) => coin === config.coin && chain === config.chain,
  })
