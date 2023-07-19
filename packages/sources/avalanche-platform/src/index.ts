import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import { envDefaultOverrides } from './config/envDefaultOverrides'

const adapterContext = { name: NAME, envDefaultOverrides }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, endpoints }
