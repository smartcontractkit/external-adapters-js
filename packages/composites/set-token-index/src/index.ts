import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { NAME, makeConfig } from './config'

const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)
export { makeExecute, makeConfig, server }
