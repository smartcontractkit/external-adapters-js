import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'
import { util } from '@chainlink/ea-bootstrap'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'blockchain.com':
      return (data: any) => util.toAsync(blockchainCom.execute, data)

    case 'blockcypher':
      return (data: any) => util.toAsync(blockcypher.execute, data)
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}

export { getImpl }
