import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import * as types from './endpoint'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector)
export { NAME, makeExecute, makeConfig, server, types, endpoints }
