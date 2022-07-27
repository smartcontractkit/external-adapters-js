import { Logger, Requester, AxiosRequestConfig } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, EVMNetworks, RPC_ENDPOINTS } from './config'
import { BigNumber, ethers } from 'ethers'
import { AdapterResponseEmptyError } from '@chainlink/ea-bootstrap'
import { ec, Contract } from 'starknet'

const DEFAULT_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001'
const NO_ISSUE_MSG =
  'This is an error that the EA uses to determine whether or not the L2 Sequencer is healthy.  It does not mean that there is an issue with the EA.'

// These errors come from the Sequencer when submitting an empty transaction
const sequencerOnlineErrors: Record<Networks, string[]> = {
  [Networks.Arbitrum]: ['gas price too low', 'forbidden sender address'],
  // TODO: Optimism error needs to be confirmed by their team
  [Networks.Optimism]: ['cannot accept 0 gas price transaction'],
  [Networks.Metis]: ['cannot accept 0 gas price transaction'],
  [Networks.Starkware]: ['max_fee must be bigger than 0.\n0 >= 0'],
}

export interface NetworkHealthCheck {
  (network: Networks, delta: number, deltaBlocks: number): Promise<undefined | boolean>
}

export interface ResponseSchema {
  result: number
}

export const getSequencerHealth: NetworkHealthCheck = async (
  network: Networks,
): Promise<undefined | boolean> => {
  if (!HEALTH_ENDPOINTS[network]?.endpoint) {
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

export const requestBlockHeight = async (network: EVMNetworks): Promise<number> => {
  const request: AxiosRequestConfig = {
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
  const response = await Requester.request<ResponseSchema>(request)
  const hexBlock = response.data.result
  if (!hexBlock) {
    throw new AdapterResponseEmptyError({
      message: `Block number not found on network: ${network}`,
    })
  }
  return BigNumber.from(hexBlock).toNumber()
}

// TODO: Implement when ready
export const getL1RollupStatus: NetworkHealthCheck = async (): Promise<boolean> => {
  return true
}

export const sendEVMDummyTransaction = async (
  network: EVMNetworks,
  timeout: number,
): Promise<boolean> => {
  const rpcEndpoint = RPC_ENDPOINTS[network]
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
  const wallet = new ethers.Wallet(DEFAULT_PRIVATE_KEY, provider)

  const networkTx: Record<EVMNetworks, ethers.providers.TransactionRequest> = {
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
    [Networks.Metis]: {
      value: 0,
      gasLimit: 0,
      gasPrice: 0,
      to: wallet.address,
    },
  }
  const receipt = await race<ethers.providers.TransactionResponse>({
    timeout,
    promise: wallet.sendTransaction(networkTx[network]),
    error: `Transaction receipt not received in ${timeout} milliseconds`,
  })
  Logger.info(`Transaction receipt received with hash ${receipt.hash} for EVM network: ${network}`)
  return (await receipt.wait()).confirmations > 0
}

const sendDummyStarkwareTransaction = async (timeout: number): Promise<boolean> => {
  const starkKeyPair = ec.genKeyPair(DEFAULT_PRIVATE_KEY)
  const starkKeyPub = ec.getStarkKey(starkKeyPair)
  const argentContract = new Contract(
    [
      {
        inputs: [
          {
            name: 'signer',
            type: 'felt',
          },
          {
            name: 'guardian',
            type: 'felt',
          },
        ],
        name: 'initialize',
        outputs: [],
        type: 'function',
      },
    ],
    '0xd175dcf2fcf9d858d8d686826d56db7aeb29c3490110b4cfe0d8442944b828',
  )

  const receipt = await race({
    timeout,
    promise: argentContract.initialize(starkKeyPub, '0', {
      maxFee: '0',
    }),
    error: `Transaction receipt not received in ${timeout} milliseconds`,
  })
  console.log(receipt)
  return true
}

export const getStatusByTransaction = async (
  network: Networks,
  timeout: number,
): Promise<boolean> => {
  const sendDummyTxnFns = {
    [Networks.Arbitrum]: sendEVMDummyTransaction,
    [Networks.Optimism]: sendEVMDummyTransaction,
    [Networks.Metis]: sendEVMDummyTransaction,
    [Networks.Starkware]: sendDummyStarkwareTransaction,
  }
  const _getErrorMessage = (e: Error): string => {
    const paths = {
      [Networks.Arbitrum]: ['error', 'message'],
      [Networks.Optimism]: ['error', 'message'],
      [Networks.Metis]: ['error', 'message'],
      [Networks.Starkware]: ['message'],
    }
    return (Requester.getResult(e, paths[network]) as string) || ''
  }

  try {
    Logger.info(`Submitting empty transaction for network: ${network}`)
    if (network !== Networks.Starkware) {
      return await sendDummyTxnFns[network](network, timeout)
    }
    return await sendDummyTxnFns[network](timeout)
  } catch (e) {
    const error = e as Error
    if (sequencerOnlineErrors[network].includes(_getErrorMessage(error))) {
      Logger.debug(
        `Transaction submission failed with an expected error ${_getErrorMessage(error)}.`,
      )
      return true
    }
    Logger.error(
      `Transaction submission failed with an unexpected error. ${NO_ISSUE_MSG} Error Message: ${error.message}`,
    )
    return false
  }
}

export function race<T>({
  promise,
  timeout,
  error,
}: {
  promise: Promise<T>
  timeout: number
  error: string
}): Promise<T> {
  let timer: NodeJS.Timeout

  return Promise.race([
    new Promise((_, reject) => {
      timer = setTimeout(reject, timeout, error)
    }) as Promise<T>,
    promise.then((value) => {
      clearTimeout(timer)
      return value
    }),
  ])
}
