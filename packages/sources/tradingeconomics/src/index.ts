import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler, endpointSelector } from './adapter'
import { NAME, makeConfig } from './config'
import * as types from './endpoint'

const { server } = expose(NAME, makeExecute(), makeWSHandler(), endpointSelector)
export { NAME, makeExecute, makeConfig, server, types }
