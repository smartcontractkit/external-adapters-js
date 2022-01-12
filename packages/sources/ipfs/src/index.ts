import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'
import { endpointSelector } from './adapter'
import * as types from './endpoint'

const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types }
