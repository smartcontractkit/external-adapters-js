import { AdapterContext, expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import * as rateLimit from './config/limits.json'

const envDefaultOverrides = { WARMUP_ENABLED: 'false' }
const adapterContext = { name: NAME, rateLimit, envDefaultOverrides }

const { server } = expose(
  adapterContext as AdapterContext,
  makeExecute(),
  undefined,
  endpointSelector,
)
export { NAME, makeExecute, makeConfig, server, endpoints }
