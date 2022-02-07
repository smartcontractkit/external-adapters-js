import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'
import { endpointSelector } from './adapter'
import * as types from './endpoint'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types }
