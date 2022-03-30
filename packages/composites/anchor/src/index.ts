import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)

export { NAME, makeConfig, makeExecute, server }
