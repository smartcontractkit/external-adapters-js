import { Execute } from '@chainlink/types'
import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'
import blockchair from '@chainlink/blockchair'

export type BitcoinIndexerOptions = { type?: BitcoinIndexer }
export enum BitcoinIndexer {
  BlockchainCom = 'blockchain_com',
  Blockcypher = 'blockcypher',
  Blockchair = 'blockchair',
}

const isBitcoinIndexer = (envVar?: string): envVar is BitcoinIndexer =>
  Object.values(BitcoinIndexer).includes(envVar as any)

export const getBitcoinIndexer = (): BitcoinIndexer | undefined => {
  const bitcoinIndexer = process.env.BTC_INDEXER_ADAPTER
  return isBitcoinIndexer(bitcoinIndexer) ? (bitcoinIndexer as BitcoinIndexer) : undefined
}

export const getImpl = (options: BitcoinIndexerOptions): Execute => {
  const prefix = options.type?.toUpperCase()
  switch (options.type) {
    case BitcoinIndexer.BlockchainCom:
      return (data) => {
        const config = blockchainCom.getConfig(prefix)
        return blockchainCom.execute(data, config)
      }

    case BitcoinIndexer.Blockcypher:
      return (data) => {
        const config = blockcypher.getConfig(prefix)
        return blockcypher.execute(data, config)
      }

    case BitcoinIndexer.Blockchair:
      return (data) => {
        const config = blockchair.getConfig(prefix)
        return blockchair.execute(data, config)
      }
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}
