import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)

export { NAME, makeExecute, makeConfig, server }
