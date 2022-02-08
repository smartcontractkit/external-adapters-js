import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

export = {
  NAME,
  makeConfig,
  makeExecute,
  ...expose(adapterContext, makeExecute(), undefined, endpointSelector),
}
