import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, ExtendedConfig } from './config'

import {
  checkStarkwareSequencerPendingTransactions,
  sendDummyStarkwareTransaction,
} from './starkware'
import { checkOptimisticRollupBlockHeight, sendEVMDummyTransaction } from './evm'

const NO_ISSUE_MSG =
  'This is an error that the EA uses to determine whether or not the L2 Sequencer is healthy.  It does not mean that there is an issue with the EA.'

// These errors come from the Sequencer when submitting an empty transaction
const sequencerOnlineErrors: Record<Networks, string[]> = {
  [Networks.Arbitrum]: ['gas price too low', 'forbidden sender address', 'intrinsic gas too low'],
  // TODO: Optimism error needs to be confirmed by their team
  [Networks.Optimism]: ['cannot accept 0 gas price transaction'],
  [Networks.Base]: ['transaction underpriced'],
  [Networks.Linea]: ['Gas price below configured minimum gas price'],
  [Networks.Metis]: ['cannot accept 0 gas price transaction'],
  [Networks.Scroll]: ['invalid transaction: insufficient funds for l1fee + gas * price + value'],
  // Sending an empty transaction to the dummy Starknet address should return one
  // of the following error messages. The errors defined below can be a substring
  // of the actual error message that is thrown. The Sequencer is considered healthy
  // if the EA returns one of the errors below before the pre-configured timeout
  // expires. The 'Contract not found' error is thrown whenever the dummy address
  // has not been deployed to the network. The OutOfRangeFee error is thrown when
  // the network detects a transaction sent with 0 gas.
  [Networks.Starkware]: ['Contract not found', 'Known(OutOfRangeFee)'],
  [Networks.zkSync]: ['max fee per gas less than block base fee'],
}

export interface NetworkHealthCheck {
  (network: Networks, config: ExtendedConfig): Promise<undefined | boolean>
}

export interface ResponseSchema {
  result: number
}

export const checkSequencerHealth: NetworkHealthCheck = async (
  network: Networks,
): Promise<undefined | boolean> => {
  if (!HEALTH_ENDPOINTS[network]?.endpoint) {
    return
  }
  const response = await Requester.request({
    url: HEALTH_ENDPOINTS[network]?.endpoint,
  })

  // If the network has a custom response processing function, use it
  const isHealthy = HEALTH_ENDPOINTS[network].processResponse(response.data)

  Logger.info(
    `[${network}] Health endpoint for network ${network} returned a ${
      isHealthy ? 'healthy' : 'unhealthy'
    } response`,
  )
  return isHealthy
}

export const getStatusByTransaction = async (
  network: Networks,
  config: ExtendedConfig,
): Promise<boolean> => {
  let isSequencerHealthy = true
  try {
    Logger.info(`[${network}] Submitting empty transaction for network: ${network}`)
    await sendEmptyTransaction(network, config)
  } catch (e) {
    isSequencerHealthy = isExpectedErrorMessage(network, e as Error)
  }
  return isSequencerHealthy
}

const sendEmptyTransaction = async (network: Networks, config: ExtendedConfig): Promise<void> => {
  switch (network) {
    case Networks.Starkware:
      await sendDummyStarkwareTransaction(config)
      break
    default:
      await sendEVMDummyTransaction(network, config.timeoutLimit)
  }
}

const isExpectedErrorMessage = (network: Networks, error: Error) => {
  const _getErrorMessage = (error: Error): string => {
    const paths: Record<Networks, string[]> = {
      [Networks.Arbitrum]: ['error', 'message'],
      [Networks.Optimism]: ['error', 'message'],
      [Networks.Base]: ['error', 'message'],
      [Networks.Linea]: ['error', 'message'],
      [Networks.Metis]: ['error', 'message'],
      [Networks.Scroll]: ['error', 'error', 'message'],
      [Networks.Starkware]: ['message'],
      [Networks.zkSync]: ['error', 'message'],
    }
    return (Requester.getResult(error, paths[network]) as string) || ''
  }
  const actualError = _getErrorMessage(error)
  for (const expectedError of sequencerOnlineErrors[network]) {
    if (actualError.includes(expectedError)) {
      Logger.debug(
        `[${network}] Transaction submission failed with an expected error ${actualError}.`,
      )
      return true
    }
  }
  Logger.error(
    `[${network}] Transaction submission failed with an unexpected error. ${NO_ISSUE_MSG} Error Message: ${error.message}`,
  )
  return false
}

export const checkNetworkProgress: NetworkHealthCheck = (
  network: Networks,
  config: ExtendedConfig,
) => {
  switch (network) {
    case Networks.Starkware:
      return checkStarkwareSequencerPendingTransactions()(config)
    default:
      return checkOptimisticRollupBlockHeight(network)(config)
  }
}

export async function retry<T>({
  promise,
  retryConfig,
}: {
  promise: () => Promise<T>
  retryConfig: ExtendedConfig['retryConfig']
}): Promise<T> {
  let numTries = 0
  let error
  while (numTries < retryConfig.numRetries) {
    try {
      return await promise()
    } catch (e) {
      error = e
      numTries++
      await util.sleep(retryConfig.retryInterval)
    }
  }
  throw error
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
