// import { Requester, Validator } from '@chainlink/external-adapter'
import JSONRPC from '@chainlink/json-rpc-adapter'
import { Execute } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { Requester } from '@chainlink/external-adapter'


const inputParams = {
  url: false,
  method: false,
  params: false,
  blockchain: false,
  coin: false,
  endpoint: false
}

const convertEndpoint: { [key: string]: string } = {
  height: 'headers',
}

// Export function to integrate with Chainlink node
// TODO: check the request type
export const execute: Execute = async (request: any) => {
  const validator = new Validator(request, inputParams)
  const blockchain = validator.validated.data.blockchain || validator.validated.data.coin

  let endpoint = validator.validated.data.endpoint 

  if (validator.error) throw validator.error
  if (blockchain != undefined && blockchain.toLowerCase() === 'btc') {
    if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]
    if (!endpoint) endpoint = 'difficulty'
    request.data.method = 'getblockchaininfo'
  }

  const response = await JSONRPC.execute(request)
  
  console.log(response.data.result)
  if (endpoint) {
    if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]
    response.result = Requester.validateResultNumber(response.data, ['result', endpoint])
  }
  response.data = response.data.result
  return response
}

