import JSONRPC from '@chainlink/json-rpc-adapter'
import { Execute, AdapterRequest } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { Requester } from '@chainlink/external-adapter'

const inputParams = {
  url: false,
  method: false,
  params: false,
  blockchain: false,
  coin: false,
  endpoint: false,
}

const convertEndpoint: { [key: string]: string } = {
  height: 'headers',
}

// Export function to integrate with Chainlink node
export const execute: Execute = async (request: AdapterRequest) => {
  const validator = new Validator(request, inputParams)
  const blockchain = validator.validated.data.blockchain || validator.validated.data.coin

  let endpoint = validator.validated.data.endpoint

  if (validator.error) throw validator.error
  if (endpoint != undefined || blockchain != undefined) {
    if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]
    if (!endpoint) endpoint = 'difficulty'
    request.data.method = 'getblockchaininfo'
  }

  const response = await JSONRPC.execute(request)

  if (endpoint) {
    if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]
    response.result = Requester.validateResultNumber(response.data, ['result', endpoint])
    // data are returned in result, due to the called adapter, needs to be moved to data object
    response.data = response.data.result
    response.data.result = response.result
  }

  return response
}
