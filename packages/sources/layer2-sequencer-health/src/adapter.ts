import { ExecuteFactory } from '@chainlink/types'
import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig, Networks, makeConfig } from './config'
import {
  requestBlockHeight,
  getSequencerHealth,
  getL1RollupStatus,
  NetworkHealthCheck,
} from './network'

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
      Logger.info(
        `Block #${block} is not considered stale at ${Date.now()}. Last seen block #${
          lastSeenBlock.block
        } was at ${lastSeenBlock.timestamp}`,
      )
      return true
    }
    Logger.warn(
      `Block #${block} is considered stale at ${Date.now()}. Last seen block #${
        lastSeenBlock.block
      } was at ${lastSeenBlock.timestamp}, more than ${delta} miliseconds ago.`,
    )
    return false
  }
}

const networks: Record<Networks, (delta: number) => Promise<boolean>> = {
  [Networks.Arbitrum]: makeNetworkStatusCheck(Networks.Arbitrum),
  [Networks.Optimism]: makeNetworkStatusCheck(Networks.Optimism),
}

export const getL2NetworkStatus: NetworkHealthCheck = (network: Networks, delta: number) => {
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

  const _translateIntoFeedResponse = (isHealthy: boolean): number => {
    return isHealthy ? 0 : 1
  }

  const _respond = (isHealthy: boolean) =>
    Requester.success(
      jobRunID,
      {
        data: {
          isHealthy: _translateIntoFeedResponse(isHealthy),
          result: _translateIntoFeedResponse(isHealthy),
        },
      },
      config.verbose,
    )

  const _tryMethod = (fn: NetworkHealthCheck) => async (
    network: Networks,
    delta: number,
  ): Promise<boolean> => {
    try {
      const isHealthy = await fn(network, delta)
      if (isHealthy === false) {
        Logger.warn(
          `Method ${fn.name} reported an unhealthy response. Network ${network} considered unhealthy`,
        )
        return false
      }
    } catch (e) {
      Logger.error(
        `Method ${fn.name} failed: ${e.message}. Network ${network} considered unhealthy`,
      )
      return false
    }
    return true
  }

  // #1 Option: Direct check on health endpoint
  // #2 Option: Check block height
  // #3 Option: Check L1 Rollup Contract
  // If every method succeeds, the Network is considered healthy
  const wrappedMethods = [getSequencerHealth, getL2NetworkStatus, getL1RollupStatus].map(_tryMethod)
  for (let i = 0; i < wrappedMethods.length; i++) {
    const method = wrappedMethods[i]
    const isHealthy = await method(network, config.delta)
    if (!isHealthy) return _respond(false)
  }

  return _respond(true)
}

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
