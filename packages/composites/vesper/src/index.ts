import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'VESPER'

export = {
  NAME,
  makeConfig,
  makeExecute,
  ...expose(NAME, makeExecute(), undefined, endpointSelector),
}
