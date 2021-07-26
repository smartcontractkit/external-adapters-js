import { Requester } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, RPC_ENDPOINTS } from './config'
import { BigNumber } from 'ethers'

export const requestBlockHeight = async (network: Networks): Promise<number> => {
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
      id: 1,
    },
  }
  const response = await Requester.request(request)
  const hexBlock = response?.data?.result
  if (!hexBlock) {
    throw new Error(`Block number not found on network: ${network}`)
  }
  return BigNumber.from(hexBlock).toNumber()
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
