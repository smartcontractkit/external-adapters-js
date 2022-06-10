import { AdapterContext, expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import rateLimit from './config/limits.json'

const adapterContext: AdapterContext = { name: NAME, rateLimit }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, endpoints }
