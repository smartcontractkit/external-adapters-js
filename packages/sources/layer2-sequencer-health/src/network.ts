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
  const isHealthy = !!Requester.getResult(response.data, HEALTH_ENDPOINTS[network]?.responsePath)
  Logger.info(
    `Health endpoint for network ${network} returned a ${
      isHealthy ? 'healthy' : 'unhealthy'
    } response`,
  )
  return isHealthy
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
  timeout: number,
): Promise<boolean> => {
  const rpcEndpoint = RPC_ENDPOINTS[network]
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
  const wallet = new ethers.Wallet(ethers.Wallet.createRandom()?.privateKey, provider)

  // These errors come from the Sequencer when submitting an empty transaction
  const sequencerOnlineErrors: Record<Networks, string[]> = {
    [Networks.Arbitrum]: ['gas price too low', 'forbidden sender address'],
    // TODO: Optimism error needs to be confirmed by their team
    [Networks.Optimism]: ['cannot accept 0 gas price transaction'],
  }

  const networkTx: Record<Networks, ethers.providers.TransactionRequest> = {
    // Arbitrum zero gas price will be auto adjusted by the network to the minimum
    [Networks.Arbitrum]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 1,
      to: wallet.address,
    },
    [Networks.Optimism]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
  }
  const _getErrorMessage = (e: any): string => {
    const paths = {
      [Networks.Arbitrum]: ['error', 'message'],
      [Networks.Optimism]: ['error', 'message'],
    }
    return (Requester.getResult(e, paths[network]) as string) || ''
  }
  const _setTxTimeout = (timeout: number): Promise<never> =>
    new Promise((_, rej) =>
      setTimeout(
        () => rej(new Error(`Transaction receipt not received in ${timeout} milliseconds`)),
        timeout,
      ),
    )
  try {
    Logger.info(`Submitting empty transaction for network: ${network}`)
    const receipt = await Promise.race([
      _setTxTimeout(timeout),
      wallet.sendTransaction(networkTx[network]),
    ])
    Logger.info(`Transaction receipt received with hash ${receipt.hash} for network: ${network}`)
    return (await receipt.wait()).confirmations > 0
  } catch (e) {
    if (sequencerOnlineErrors[network].includes(_getErrorMessage(e))) {
      Logger.info(`Transaction submission failed with an expected error: ${_getErrorMessage(e)}`)
      return true
    }
    Logger.error(`Transaction submission failed with an unexpected error: ${e.message}`)
    return false
  }
}
