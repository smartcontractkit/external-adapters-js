import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector),
}
