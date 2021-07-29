import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(NAME, makeExecute(), makeWSHandler(), endpointSelector),
}
