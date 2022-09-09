import { makeExecute, endpointSelector } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'
import { NAME, makeConfig } from './config'
import * as endpoints from './endpoint'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeConfig, makeExecute, server, endpoints }
