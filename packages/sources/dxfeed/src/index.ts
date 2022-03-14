import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector)

export { NAME, endpoints, makeExecute, makeWSHandler, makeConfig, endpointSelector, server }
