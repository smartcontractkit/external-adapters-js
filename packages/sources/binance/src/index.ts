import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose(NAME, makeExecute(), makeWSHandler(), endpointSelector)
export { NAME, makeExecute, makeConfig, server }
