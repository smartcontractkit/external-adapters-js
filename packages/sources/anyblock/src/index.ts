import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig, NAME } from './config'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(adapterContext, makeExecute(), undefined, endpointSelector),
}
