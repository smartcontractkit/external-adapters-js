import { Requester } from '@chainlink/ea-bootstrap'
import { balance } from '@chainlink/ea-factories'
import { Config, ExecuteFactory } from '@chainlink/types'

export const supportedEndpoints = ['balance']

export const description = 'Balance endpoint for test adapter'

export const inputParameters = balance.inputParameters

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig: any = {
    ...config.api,
    url: `/address/${account.address}`,
    headers: {
      ...config.api.headers,
      'blockchain-id': 'bitcoin-network',
    },
  }
  const response = await Requester.request(reqConfig)
  return {
    payload: response.data,
    result: [{ ...account, balance: response.data.payload.value }],
  }
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported: () => true })
