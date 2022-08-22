import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector, makeWSHandler } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import type * as types from './types'
import * as rateLimit from './config/limits.json'
import { envDefaultOverrides } from './config/envDefaultOverrides'

const adapterContext = { name: NAME, envDefaultOverrides, rateLimit }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector)
export { NAME, makeExecute, makeConfig, server, types, endpoints }
