import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'blockchain.com':
      return (data: any) => blockchainCom.execute(data, blockchainCom.getConfig())

    case 'blockcypher':
      return (data: any) => blockcypher.execute(data, blockcypher.getConfig())
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}

export { getImpl }
