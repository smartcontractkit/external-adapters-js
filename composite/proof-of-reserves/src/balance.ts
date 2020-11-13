import { Execute } from '@chainlink/types'
import amberdata from '@chainlink/amberdata'
import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'
import blockchair from '@chainlink/blockchair'
import btcCom from '@chainlink/btc.com'
import sochain from '@chainlink/sochain'
import cryptoApis from '@chainlink/cryptoapis'

export type BitcoinIndexerOptions = { type?: BitcoinIndexer }
export enum BitcoinIndexer {
  Amberdata = 'amberdata',
  CryptoAPIs = 'cryptoapis',
  BlockchainCom = 'blockchain_com',
  Blockcypher = 'blockcypher',
  Blockchair = 'blockchair',
  BTCCom = 'btc_com',
  SoChain = 'sochain',
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
    case BitcoinIndexer.Amberdata:
      return (data) => {
        const config = amberdata.getConfig(prefix)
        return amberdata.execute(data, config)
      }

    case BitcoinIndexer.CryptoAPIs:
      return (data) => {
        const config = cryptoApis.getConfig(prefix)
        return cryptoApis.execute(data, config)
      }

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

    case BitcoinIndexer.BTCCom:
      return (data) => {
        const config = btcCom.getConfig(prefix)
        return btcCom.execute(data, config)
      }

    case BitcoinIndexer.SoChain:
      return (data) => {
        const config = sochain.getConfig(prefix)
        return sochain.execute(data, config)
      }
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}
