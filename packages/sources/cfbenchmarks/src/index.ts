import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute, makeWSHandler } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

export = {
  NAME,
  makeExecute,
  makeConfig,
  ...expose(adapterContext, makeExecute(), makeWSHandler(), endpointSelector),
}
