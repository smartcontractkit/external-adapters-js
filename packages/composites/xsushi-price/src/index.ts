import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig } from './config'
import * as types from './endpoint'

const NAME = 'XSUSHI_PRICE'

const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types }
