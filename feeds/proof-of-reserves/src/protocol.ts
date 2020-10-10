import renVM from '@chainlink/renvm-address-set'
import wBTC from '@chainlink/wbtc-address-set'
import { util } from '@chainlink/ea-bootstrap'

const getImpl = (options: any) => {
  switch (options.type) {
    case 'renvm':
      return (data: any) => util.toAsync(renVM.execute, data)

    case 'wbtc':
      return (data: any) => util.toAsync(wBTC.execute, data)
    default:
      throw Error(`Unknown balance adapter type: ${options.type}`)
  }
}

export { getImpl }
