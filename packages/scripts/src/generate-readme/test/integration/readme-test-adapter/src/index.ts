import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose({ name: NAME }, makeExecute(), undefined, endpointSelector)
export { NAME, makeConfig, makeExecute, server }
