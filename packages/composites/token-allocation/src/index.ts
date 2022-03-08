import { expose } from '@chainlink/ea-bootstrap'
import { makeEndpointSelector } from './adapter'
import { makeExecute } from './endpoint'
import { makeConfig, NAME } from './config'
import * as types from './types'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute())
export { NAME, types, makeExecute, makeConfig, server, makeEndpointSelector }
