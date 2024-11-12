import { DataResponse, Requester, Value } from '@chainlink/ea-bootstrap'
import { balance } from '@chainlink/ea-factories'
import { Config, ExecuteFactory } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['balance']

export const description = 'Balance endpoint for test adapter'

export const inputParameters = balance.inputParameters

const getBalance: balance.GetBalance = async (account, config) => {
  const reqConfig: any = {
    ...config.api,
    url: `/address/${account.address}`,
    headers: {
      ...config?.api?.headers,
      'blockchain-id': 'bitcoin-network',
    },
  }
  const response = await Requester.request(reqConfig)
  const data = response.data as DataResponse<Value, { value: string }>
  return {
    payload: data,
    result: [{ ...account, balance: data.payload?.value }],
  }
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) =>
  balance.make({ ...config, getBalance, isSupported: () => true })
