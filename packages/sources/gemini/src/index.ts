import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import * as types from './endpoint'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types, endpoints }
