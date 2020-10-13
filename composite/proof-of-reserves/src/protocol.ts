import renVM from '@chainlink/renvm-address-set'
import wBTC from '@chainlink/wbtc-address-set'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'renvm':
      return (data: any) => renVM.execute(data, renVM.getConfig())

    case 'wbtc':
      return (data: any) => wBTC.execute(data, wBTC.getConfig())
    default:
      throw Error(`Unknown protocol adapter type: ${options.type}`)
  }
}

export { getImpl }
