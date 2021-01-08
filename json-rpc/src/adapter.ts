import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'

const inputParams = {
  url: false,
  method: false,
  params: false,
  blockchain: false,
  coin: false,
  q: false,
}

const convertQ: { [key: string]: string } = {
  height: 'headers',
}

// Export function to integrate with Chainlink node
export const execute: Execute = async (request) => {
  const validator = new Validator(request, inputParams)

  if (validator.error) throw validator.error

  const url = process.env.RPC_URL || validator.validated.data.url || 'http://localhost:8545'
  let method = validator.validated.data.method || ''
  const params = validator.validated.data.params
  const blockchain = validator.validated.data.blockchain || validator.validated.data.coin

  let q = validator.validated.data.q

  if (blockchain != undefined && blockchain.toLowerCase() === 'btc') {
    if (!q) q = 'difficulty'
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

  if (q) {
    if (q in convertQ) q = convertQ[q]
    response.data.result = Requester.validateResultNumber(response.data, ['result', q])
  }

  return Requester.success(request.id, response)
}
