import { Logger, Requester } from '@chainlink/ea-bootstrap'
import { HEALTH_ENDPOINTS, Networks, ExtendedConfig } from './config'

import { sendDummyStarkwareTransaction } from './starkware'
import { sendEVMDummyTransaction } from './evm'
import { sleep } from '@chainlink/ea-bootstrap/src/lib/util'

const NO_ISSUE_MSG =
  'This is an error that the EA uses to determine whether or not the L2 Sequencer is healthy.  It does not mean that there is an issue with the EA.'

// These errors come from the Sequencer when submitting an empty transaction
const sequencerOnlineErrors: Record<Networks, string[]> = {
  [Networks.Arbitrum]: ['gas price too low', 'forbidden sender address'],
  // TODO: Optimism error needs to be confirmed by their team
  [Networks.Optimism]: ['cannot accept 0 gas price transaction'],
  [Networks.Metis]: ['cannot accept 0 gas price transaction'],
  [Networks.Starkware]: [
    'StarknetErrorCode.UNINITIALIZED_CONTRACT',
    'StarknetErrorCode.OUT_OF_RANGE_FEE',
  ],
}

export interface NetworkHealthCheck {
  (network: Networks, config: ExtendedConfig): Promise<undefined | boolean>
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

export const getStatusByTransaction = async (
  network: Networks,
  config: ExtendedConfig,
): Promise<boolean> => {
  let isSequencerHealthy = true
  try {
    Logger.info(`Submitting empty transaction for network: ${network}`)
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

const isExpectedErrorMessage = (network: Networks, e: Error) => {
  const _getErrorMessage = (e: Error): string => {
    const paths = {
      [Networks.Arbitrum]: ['error', 'message'],
      [Networks.Optimism]: ['error', 'message'],
      [Networks.Metis]: ['error', 'message'],
      [Networks.Starkware]: ['errorCode'],
    }
    return (Requester.getResult(e, paths[network]) as string) || ''
  }
  const error = e as Error
  if (sequencerOnlineErrors[network].includes(_getErrorMessage(error))) {
    Logger.debug(`Transaction submission failed with an expected error ${_getErrorMessage(error)}.`)
    return true
  }
  Logger.error(
    `Transaction submission failed with an unexpected error. ${NO_ISSUE_MSG} Error Message: ${error.message}`,
  )
  return false
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
      await sleep(retryConfig.retryInterval)
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
