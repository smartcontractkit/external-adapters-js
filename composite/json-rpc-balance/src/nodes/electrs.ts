import { Script } from 'bcoin'
import { Execute } from '@chainlink/types'
import { GetBalanceImpl } from './index'

export const NAME = 'electrs'

export const makeAddressBalanceCall: GetBalanceImpl = (adapter) => {
  return async (account, config) => {
    const response = await getBalance(adapter, account.address)
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
}

interface BalanceResponse {
  confirmed: number
  unconfirmed: number
}

const getBalance = async (adapter: Execute, address: string): Promise<BalanceResponse> => {
  const request = {
    id: '1',
    data: {
      method: 'blockchain.scripthash.get_balance',
      params: {
        address: convertAddressToScriptHash(address),
      },
    },
  }
  const response = await adapter(request)
  return response.data.result
}

export const convertAddressToScriptHash = (address: string): string => {
  const script = Script.fromAddress(address)
  const scriptHash = script.sha256()
  return scriptHash.reverse().toString('hex')
}
