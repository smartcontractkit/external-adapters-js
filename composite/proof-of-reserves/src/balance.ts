import blockchainCom from '@chainlink/blockchain.com'
import blockcypher from '@chainlink/blockcypher'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'blockchain.com':
      return (data: any) => {
        const prefix = blockchainCom.NAME
        const config = blockchainCom.getConfig(prefix)
        return blockchainCom.execute(data, config)
      }

    case 'blockcypher':
      return (data: any) => {
        const prefix = blockcypher.NAME
        const config = blockcypher.getConfig(prefix)
        return blockcypher.execute(data, config)
      }
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}

export { getImpl }
