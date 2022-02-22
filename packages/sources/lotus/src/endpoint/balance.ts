import * as JSONRPC from '@chainlink/json-rpc-adapter'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { BigNumber } from 'ethers'

interface Address {
  address: string
}

export const methodName = 'Filecoin.WalletBalance'

export const supportedEndpoints = ['balance', methodName]

export const description =
  'The balance endpoint will fetch the balance of each address in the query and the total sum.'

export const inputParameters: InputParameters = {
  addresses: {
    required: true,
    aliases: ['result'],
    description: 'An array of addresses to get the balances of',
    type: 'array',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses: Address[] = validator.validated.data.addresses

  const jsonRpcConfig = JSONRPC.makeConfig()
  jsonRpcConfig.api.headers['Authorization'] = `Bearer ${config.apiKey}`
  const _execute: ExecuteWithConfig<Config> = JSONRPC.makeExecute(jsonRpcConfig)

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const _getBalance = async (address: string, requestId: number) => {
    const requestData = {
      id: jobRunID,
      data: {
        method: methodName,
        params: [address],
        requestId: requestId + 1,
      },
    }
    const result = await _execute(requestData, context, jsonRpcConfig)
    return {
      address,
      result: result.data.result,
    }
  }

  const balances = await Promise.all(
    addresses.map((addr, index) => _getBalance(addr.address, index)),
  )
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
