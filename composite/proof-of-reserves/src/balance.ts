import { AdapterImplementation, Execute } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
// balance adapters
import amberdata from '@chainlink/amberdata-adapter'
import blockchainCom from '@chainlink/blockchain.com-adapter'
import blockchair from '@chainlink/blockchair-adapter'
import blockcypher from '@chainlink/blockcypher-adapter'
import btcCom from '@chainlink/btc.com-adapter'
import cryptoapis from '@chainlink/cryptoapis-adapter'
import sochain from '@chainlink/sochain-adapter'
import electrs from '@chainlink/electrs-adapter'
import btcd from '@chainlink/btcd-adapter'

const ENV_BTC_INDEXER_ADAPTER = 'BTC_INDEXER_ADAPTER'

const adapters: AdapterImplementation[] = [
  amberdata,
  blockchainCom,
  blockcypher,
  blockchair,
  btcCom,
  cryptoapis,
  sochain,
  electrs,
  btcd,
]

export type BitcoinIndexer = typeof adapters[number]['NAME']
export type BitcoinIndexerOptions = {
  type?: BitcoinIndexer
}

const isBitcoinIndexer = (envVal?: string): envVal is BitcoinIndexer =>
  !!(envVal && adapters.find(util.byName(envVal)))

export const getBitcoinIndexer = (): BitcoinIndexer | undefined => {
  const envVal = util.getEnv(ENV_BTC_INDEXER_ADAPTER)
  return isBitcoinIndexer(envVal) ? envVal : undefined
}

export const getImpl = (options: BitcoinIndexerOptions): Execute => {
  const prefix = options.type?.toUpperCase()
  const impl = adapters.find(util.byName(options.type))
  if (!impl) throw Error(`Unknown balance adapter type: ${options.type}`)

  return (data) => {
    const config = impl.makeConfig(prefix)
    const execute = impl.makeExecute(config)
    return execute(data)
  }
}
