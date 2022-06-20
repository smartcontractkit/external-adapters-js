import * as JSONRPC from '@chainlink/json-rpc-adapter'
import {
  AdapterInputError,
  Requester,
  Validator,
  AdapterDataProviderError,
  util,
} from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import { ExtendedConfig } from '@chainlink/json-rpc-adapter/src/config'

type Address = {
  address: string
}

export const methodName = 'Filecoin.WalletBalance'

export const supportedEndpoints = ['balance', methodName]

export const description =
  'The balance endpoint will fetch the balance of each address in the query and the total sum.'

export type TInputParameters = { addresses: Address[] }
export const inputParameters: InputParameters<TInputParameters> = {
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

  const jsonRpcConfig: ExtendedConfig = JSONRPC.makeConfig()
  jsonRpcConfig.api = {
    ...jsonRpcConfig.api,
    headers: { ...jsonRpcConfig.api?.headers, Authorization: `Bearer ${config.apiKey}` },
  }

  const _execute: ExecuteWithConfig<ExtendedConfig, JSONRPC.types.TInputParameters> =
    JSONRPC.makeExecute(jsonRpcConfig)

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const _getBalance = async (address: string, requestId: number) => {
    const requestData = {
      id: jobRunID,
      data: {
        url: jsonRpcConfig.RPC_URL,
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

  let balances
  try {
    balances = await Promise.all(addresses.map((addr, index) => _getBalance(addr.address, index)))
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'filecoin',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
  const response = {
    statusText: 'OK',
    status: 200,
    data: { balances },
    headers: {},
    config: jsonRpcConfig.api,
  }

  const result = balances.reduce(
    (sum, balance) => sum.add(balance.result as BigNumber),
    BigNumber.from(0),
  )

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result.toString()),
    config.verbose,
  )
}
