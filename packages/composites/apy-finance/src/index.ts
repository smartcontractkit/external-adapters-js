import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'APY-Finance'
const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)
export { NAME, makeConfig, makeExecute, server }
