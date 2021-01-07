import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'

const inputParams = {
  url: false,
  method: false,
  params: false,
  blockchain: false,
  coin: false,
  endpoint: false,
}

const convertEndpoint: {[key: string]: string} = {
  'height' : 'headers'
}

// Export function to integrate with Chainlink node
export const execute: Execute = async (request) => {
  console.log(request)
  const validator = new Validator(request, inputParams)
  
  if (validator.error) throw validator.error

  const url = process.env.RPC_URL || validator.validated.data.url || 'http://localhost:8545'
  let method = validator.validated.data.method || ''
  const params = validator.validated.data.params
  const blockchain = validator.validated.data.blockchain || validator.validated.data.coin

  let endpoint = validator.validated.data.endpoint

  if (blockchain != undefined && blockchain.toLowerCase() === 'btc') {
    if (!endpoint) endpoint = 'difficulty'
    method = 'getblockchaininfo'
  }

  const data = {
    id: request.id,
    jsonrpc: '2.0',
    method,
    params,
  }

  const options = {
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Remove undefined values
    data: JSON.parse(JSON.stringify(data)),
  }

  const response = await Requester.request(options)
  if (response.statusCode >= 400) throw response.data.error

  if (endpoint) {
    if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]
    response.data.result = Requester.validateResultNumber(response.data, ["result", endpoint])
  }

  return Requester.success(request.id, response)
}
