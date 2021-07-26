import { ExecuteFactory } from '@chainlink/types'
import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig, Networks, makeConfig } from './config'
import { requestBlockHeight, getSequencerHealth } from './network'

export const makeNetworkStatusCheck = (network: Networks) => {
  let lastSeenBlock: { block: number; timestamp: number } = {
    block: 0,
    timestamp: 0,
  }

  const _isPastBlock = (block: number) => lastSeenBlock.block === block
  const _isStaleBlock = (block: number, delta: number): boolean => {
    return _isPastBlock(block) && Date.now() - lastSeenBlock.timestamp >= delta
  }
  const _isValidBlock = (block: number) => lastSeenBlock.block <= block
  const _updateLastSeenBlock = (block: number): void => {
    lastSeenBlock = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (delta: number): Promise<boolean> => {
    const block = await requestBlockHeight(network)
    if (!_isValidBlock(block)) throw new Error('Block found is previous to last seen')
    if (!_isStaleBlock(block, delta)) {
      if (!_isPastBlock(block)) _updateLastSeenBlock(block)
      return true
    }
    return false
  }
}

const networks: Record<Networks, (delta: number) => Promise<boolean>> = {
  [Networks.Arbitrum]: makeNetworkStatusCheck(Networks.Arbitrum),
  [Networks.Optimism]: makeNetworkStatusCheck(Networks.Optimism),
}

const getNetworkStatus = (network: Networks, delta: number) => {
  return networks[network](delta)
}

export const inputParameters: InputParameters = {
  network: true,
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const network = validator.validated.data.network as Networks

  // #1 Option: Direct check on health endpoint (getSequencerHealth)
  let isHealthyFromSequencer
  try {
    isHealthyFromSequencer = await getSequencerHealth(network)
  } catch (e) {
    Logger.error(`Direct sequencer check failed: ${e.message}`)
  }

  // #2 Option: Check block height (getNetworkStatus)
  let isHealthyFromNetwork
  try {
    isHealthyFromNetwork = await getNetworkStatus(network, config.delta)
  } catch (e) {
    Logger.error(`Network health check failed: ${e.message}`)
  }

  const isHealthy = !!isHealthyFromSequencer || !!isHealthyFromNetwork
  // #3 Option: Check L1 Rollup Contract
  // TODO

  return Requester.success(jobRunID, { data: { isHealthy, result: isHealthy } }, config.verbose)
}

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
