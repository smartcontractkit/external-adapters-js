import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'
import * as types from './endpoint'
import providerLimits from './config/limits.json'

const adapterContext = {name: NAME, providerLimits}

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, types }
