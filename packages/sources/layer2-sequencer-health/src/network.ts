import { Requester } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, RPC_ENDPOINTS } from './config'

export const requestBlockHeight = async (network: Networks): Promise<string> => {
  const request = {
    method: 'POST',
    url: RPC_ENDPOINTS[network],
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
    },
  }
  const response = await Requester.request(request)
  return response?.data.result
}

export const getSequencerHealth = async (network: Networks): Promise<boolean> => {
  if (!HEALTH_ENDPOINTS[network].endpoint) {
    throw new Error(`Health endpoint not available for network: ${network}`)
  }
  const response = await Requester.request({
    url: HEALTH_ENDPOINTS[network]?.endpoint,
  })
  return !!Requester.getResult(response.data, HEALTH_ENDPOINTS[network]?.responsePath)
}
