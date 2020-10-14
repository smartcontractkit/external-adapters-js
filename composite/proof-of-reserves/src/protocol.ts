import { Execute } from '@chainlink/types'
import renVM from '@chainlink/renvm-address-set'
import wBTC from '@chainlink/wbtc-address-set'

export type ProtocolOptions = { type: Protocol }
export type Protocol = 'wbtc' | 'renvm'

export const getImpl = (options: ProtocolOptions): Execute => {
  const prefix = options.type.toUpperCase()
  switch (options.type) {
    case 'renvm':
      return (data) => {
        const config = renVM.getConfig(prefix)
        return renVM.execute(data, config)
      }

    case 'wbtc':
      return (data) => {
        const config = wBTC.getConfig(prefix)
        return wBTC.execute(data, config)
      }
    default:
      throw Error(`Unknown protocol adapter type: ${options.type}`)
  }
}
