import JSONRPC from '@chainlink/json-rpc-adapter'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { BigNumber } from 'ethers'

export const methodName = 'Filecoin.WalletBalance'

export const supportedEndpoints = ['balance', methodName]

export const inputParameters: InputParameters = {
  addresses: ['addresses', 'result'],
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses: string[] = validator.validated.data.addresses

  const jsonRpcConfig = JSONRPC.makeConfig()
  jsonRpcConfig.api.headers['Authorization'] = `Bearer ${config.apiKey}`

  const _getBalance = async (address: string, requestId: number) => {
    const requestData = {
      id: jobRunID,
      data: {
        method: methodName,
        params: [address],
        requestId: requestId + 1,
      },
    }
    const result = await JSONRPC.execute(requestData, context, jsonRpcConfig)
    return {
      address,
      result: result.data.result,
    }
  }

  const balances = await Promise.all(addresses.map(_getBalance))
  const response = {
    statusText: 'OK',
    status: 200,
    data: { balances },
    headers: {},
    config: jsonRpcConfig.api,
  }

  const result = balances.reduce((sum, balance) => sum.add(balance.result), BigNumber.from(0))

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result.toString()),
    config.verbose,
  )
}
