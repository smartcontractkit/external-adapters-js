import { Logger, Requester } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, RPC_ENDPOINTS } from './config'
import { BigNumber, ethers } from 'ethers'

export interface NetworkHealthCheck {
  (network: Networks, delta: number, deltaBlocks: number): Promise<undefined | boolean>
}

export const getSequencerHealth: NetworkHealthCheck = async (
  network: Networks,
): Promise<undefined | boolean> => {
  if (!HEALTH_ENDPOINTS[network].endpoint) {
    Logger.info(`Health endpoint not available for network: ${network}`)
    return
  }
  const response = await Requester.request({
    url: HEALTH_ENDPOINTS[network]?.endpoint,
  })
  return !!Requester.getResult(response.data, HEALTH_ENDPOINTS[network]?.responsePath)
}

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

// TODO: Implement when ready
export const getL1RollupStatus: NetworkHealthCheck = async (): Promise<boolean> => {
  return true
}

export const getStatusByTransaction = async (
  network: Networks,
  privateKey: string,
  timeout = 10,
): Promise<boolean> => {
  const rpcEndpoint = RPC_ENDPOINTS[network]
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
  const wallet = new ethers.Wallet(privateKey, provider)

  const _setTimeout = (timeout: number): Promise<never> =>
    new Promise((_, rej) =>
      setTimeout(
        () => rej(new Error(`Transaction receipt not received in ${timeout} seconds`)),
        timeout * 1000,
      ),
    )
  Logger.info(`Submitting empty transaction for network: ${network}`)

  const tx = {
    to: wallet.address,
    gasPrice: 0,
    gasLimit: 0,
    value: 0,
  }
  try {
    const receipt = await Promise.race([_setTimeout(timeout), wallet.sendTransaction(tx)])
    Logger.info(`Transaction receipt received for network: ${network}`)
    return (await receipt.wait()).confirmations > 0
  } catch (e) {
    Logger.error(`Transaction submission failed: ${e.message}`)
    return false
  }
}
