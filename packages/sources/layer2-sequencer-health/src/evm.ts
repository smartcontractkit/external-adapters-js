import { AdapterResponseInvalidError, Logger } from '@chainlink/ea-bootstrap'
import { EVMNetworks, ExtendedConfig } from './config'
import { requestBlockHeight } from './network'

export const checkOptimisticRollupBlockHeight = (
  network: EVMNetworks,
): ((config: ExtendedConfig) => Promise<boolean>) => {
  let lastSeenBlock: { block: number; timestamp: number } = {
    block: 0,
    timestamp: 0,
  }

  const _isPastBlock = (block: number) => block <= lastSeenBlock.block
  const _isStaleBlock = (block: number, delta: number): boolean => {
    return _isPastBlock(block) && Date.now() - lastSeenBlock.timestamp >= delta
  }
  // If the request hit a replica node that fell behind, the block could be previous to the last seen. Including a deltaBlocks range to consider this case.
  const _isValidBlock = (block: number, deltaBlocks: number) =>
    lastSeenBlock.block - block <= deltaBlocks
  const _updateLastSeenBlock = (block: number): void => {
    lastSeenBlock = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (config: ExtendedConfig): Promise<boolean> => {
    const { delta, deltaBlocks } = config
    const block = await requestBlockHeight(network)
    if (!_isValidBlock(block, deltaBlocks))
      throw new AdapterResponseInvalidError({
        message: `Block found #${block} is previous to last seen #${lastSeenBlock.block} with more than ${deltaBlocks} difference`,
      })
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
      } was at ${lastSeenBlock.timestamp}, more than ${delta} milliseconds ago.`,
    )
    return false
  }
}
