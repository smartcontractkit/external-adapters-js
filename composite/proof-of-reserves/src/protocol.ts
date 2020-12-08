import { Execute, Implementations } from '@chainlink/types'
import renVM from '@chainlink/renvm-address-set-adapter'
import wBTC from '@chainlink/wbtc-address-set-adapter'

export type ProtocolOptions = { type?: Protocol }
export enum Protocol {
  WBTC = 'wbtc',
  RenVM = 'renvm',
}
const implLookup: Implementations<Protocol> = {
  WBTC: wBTC,
  RemVM: renVM,
}

const isProtocol = (envVar?: string): envVar is Protocol =>
  Object.values(Protocol).includes(envVar as any)

export const getProtocol = (): Protocol | undefined => {
  const protocol = process.env.PROTOCOL_ADAPTER
  return isProtocol(protocol) ? (protocol as Protocol) : undefined
}

export const getImpl = (options: ProtocolOptions): Execute => {
  const prefix = options.type?.toUpperCase()
  const impl = options.type && implLookup[options.type]
  if (!impl) throw Error(`Unknown balance adapter type: ${options.type}`)

  return (data) => {
    const config = impl.makeConfig(prefix)
    const execute = impl.makeExecute(config)
    return execute(data)
  }
}
