import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Account, Config } from '@chainlink/types'
import { isCoinType, isChainType } from '.'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'balance'

const getBalanceURI = (account: Account, confirmations: number) => {
  account.coin = account.coin?.toUpperCase()
  if (account.chain === 'testnet') account.coin = account.coin + 'TEST'
  return `/api/v2/get_address_balance/${account.coin}/${account.address}/${confirmations}`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const options = {
    ...config.api,
    url: getBalanceURI(account, config.confirmations as number),
  }

  const response = await Requester.request(options)
  const balance = util.convertUnits(account.coin, response.data.data.confirmed_balance)

  return {
    payload: response.data,
    result: [{ ...account, balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
