import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'

<<<<<<< HEAD
const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server }
=======
const { server } = expose(NAME, makeExecute(), undefined, endpointSelector)

export { NAME, endpoints, makeExecute, makeConfig, server }
>>>>>>> ec8b53ef5 (refactor: update source adapters to export endpoints & use module export)
