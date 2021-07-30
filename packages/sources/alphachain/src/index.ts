import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(NAME, makeExecute(), undefined, endpointSelector),
}
