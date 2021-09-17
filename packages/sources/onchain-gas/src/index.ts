import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(NAME, makeExecute(), makeWSHandler(makeConfig()), endpointSelector),
}
