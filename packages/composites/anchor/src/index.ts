import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

/**
 * NOTE: This adapter could probably be made more general in the future.  All it is really doing is fetching an intermediary token price
 * using the Token Allocation adapter and handling the price after that.
 */

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)

export { NAME, makeConfig, makeExecute, server }
