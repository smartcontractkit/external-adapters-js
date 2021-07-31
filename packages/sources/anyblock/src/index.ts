import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'ANYBLOCK'

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(NAME, makeExecute(), undefined, endpointSelector),
}
