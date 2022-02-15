import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector)
export { NAME, makeExecute, makeConfig, server }
