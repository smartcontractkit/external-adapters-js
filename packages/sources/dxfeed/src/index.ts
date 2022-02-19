import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector)

export { NAME, makeExecute, makeWSHandler, makeConfig, endpointSelector, server }
