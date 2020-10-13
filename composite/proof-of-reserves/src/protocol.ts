import renVM from '@chainlink/renvm-address-set'
import wBTC from '@chainlink/wbtc-address-set'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'renvm':
      return (data: any) => {
        const prefix = renVM.NAME
        const config = renVM.getConfig(prefix)
        return renVM.execute(data, config)
      }

    case 'wbtc':
      return (data: any) => {
        const prefix = wBTC.NAME
        const config = wBTC.getConfig(prefix)
        return wBTC.execute(data, config)
      }
    default:
      throw Error(`Unknown protocol adapter type: ${options.type}`)
  }
}

export { getImpl }
