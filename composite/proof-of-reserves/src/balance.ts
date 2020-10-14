import { Execute } from '@chainlink/types'
import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'

export type BitcoinIndexerOptions = { type: BitcoinIndexer }
export type BitcoinIndexer = 'blockchain_com' | 'blockcypher'

export const getImpl = (options: BitcoinIndexerOptions): Execute => {
  const prefix = options.type.toUpperCase()
  switch (options.type) {
    case 'blockchain_com':
      return (data) => {
        const config = blockchainCom.getConfig(prefix)
        return blockchainCom.execute(data, config)
      }

    case 'blockcypher':
      return (data) => {
        const config = blockcypher.getConfig(prefix)
        return blockcypher.execute(data, config)
      }
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}
