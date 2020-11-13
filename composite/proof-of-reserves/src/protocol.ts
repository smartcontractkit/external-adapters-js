import { ExecuteWithDefaults } from '@chainlink/types'
import renVM from '@chainlink/renvm-address-set'
import wBTC from '@chainlink/wbtc-address-set'

export type ProtocolOptions = { type?: Protocol }
export enum Protocol {
  WBTC = 'wbtc',
  RenVM = 'renvm',
}

const isProtocol = (envVar?: string): envVar is Protocol =>
  Object.values(Protocol).includes(envVar as any)

export const getProtocol = (): Protocol | undefined => {
  const protocol = process.env.PROTOCOL_ADAPTER
  return isProtocol(protocol) ? (protocol as Protocol) : undefined
}

export const getImpl = (options: ProtocolOptions): ExecuteWithDefaults => {
  const prefix = options.type?.toUpperCase()
  switch (options.type) {
    case Protocol.RenVM:
      return (data) => {
        const config = renVM.getConfig(prefix)
        return renVM.execute(data, config)
      }

    case Protocol.WBTC:
      return (data) => {
        const config = wBTC.getConfig(prefix)
        return wBTC.execute(data, config)
      }
    default:
      throw Error(`Unknown protocol adapter type: ${options.type}`)
  }
}
