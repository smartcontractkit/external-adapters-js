import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import * as rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

const NAME2 = 'NAME'
const { server } = expose(adapterContext, makeExecute(), undefined, endpointSelector)
export { NAME, makeExecute, makeConfig, server, endpoints, NAME2 }

//This is a dummy change to for yarn workspaces to pull in the composite adapter
