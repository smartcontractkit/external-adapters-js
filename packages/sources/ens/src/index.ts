import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME, envDefaultOverrides } from './config'
import type * as types from './types'
import * as rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit, envDefaultOverrides }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types, endpoints }
