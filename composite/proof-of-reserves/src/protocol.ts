import { Execute, AdapterImplementation } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
// protocol adapters
import renVM from '@chainlink/renvm-address-set-adapter'
import wBTC from '@chainlink/wbtc-address-set-adapter'

const ENV_PROTOCOL_ADAPTER = 'PROTOCOL_ADAPTER'

const adapters: AdapterImplementation[] = [wBTC, renVM]

export type Protocol = typeof adapters[number]['NAME']
export type ProtocolOptions = {
  type?: Protocol
}

const isProtocol = (envVal?: string): envVal is Protocol =>
  !!(envVal && adapters.find(util.byName(envVal)))

export const getProtocol = (): Protocol | undefined => {
  const envVal = util.getEnv(ENV_PROTOCOL_ADAPTER)
  return isProtocol(envVal) ? envVal : undefined
}

export const getImpl = (options: ProtocolOptions): Execute => {
  const prefix = options.type?.toUpperCase()
  const impl = adapters.find(util.byName(options.type))
  if (!impl) throw Error(`Unknown protocol adapter type: ${options.type}`)

  return (data) => {
    const config = impl.makeConfig(prefix)
    const execute = impl.makeExecute(config)
    return execute(data)
  }
}
