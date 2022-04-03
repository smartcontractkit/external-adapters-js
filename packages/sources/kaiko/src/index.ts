import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import * as types from './endpoint'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, endpoints, makeExecute, makeConfig, server, types }
