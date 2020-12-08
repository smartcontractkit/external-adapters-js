import { Execute, Implementations } from '@chainlink/types'
import renVM from '@chainlink/renvm-address-set-adapter'
import wBTC from '@chainlink/wbtc-address-set-adapter'

export type ProtocolOptions = { type?: Protocol }
export enum Protocol {
  WBTC = 'wbtc',
  RenVM = 'renvm',
}
const implLookup: Implementations<Protocol> = {
  [wBTC.NAME]: wBTC,
  [renVM.NAME]: renVM,
}

const isProtocol = (envVar?: string): envVar is Protocol =>
  Object.values(Protocol).includes(envVar as any)

export const getProtocol = (): Protocol | undefined => {
  const protocol = process.env.PROTOCOL_ADAPTER
  return isProtocol(protocol) ? (protocol as Protocol) : undefined
}

export const getImpl = (options: ProtocolOptions): ExecuteWithDefaults => {
  const prefix = options.type?.toUpperCase()
  const impl = options.type && implLookup[options.type?.toUpperCase()]
  if (!impl) throw Error(`Unknown protocol adapter type: ${options.type}`)

  return (data) => {
    const config = impl.makeConfig(prefix)
    const execute = impl.makeExecute(config)
    return execute(data)
  }
}
