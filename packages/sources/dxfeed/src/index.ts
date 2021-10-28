import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose(NAME, makeExecute(), makeWSHandler(), endpointSelector)

export { NAME, makeExecute, makeWSHandler, makeConfig, endpointSelector, server }
