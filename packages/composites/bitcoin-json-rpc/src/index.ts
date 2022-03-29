import { endpointSelector, makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server }
