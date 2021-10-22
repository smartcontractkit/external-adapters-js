import { expose } from '@chainlink/ea-bootstrap'
import * as dxfeed from '@chainlink/dxfeed-adapter'
import { makeConfig, NAME } from './config'

export = {
  NAME,
  makeExecute: dxfeed.makeExecute,
  makeConfig,
  ...expose(NAME, dxfeed.makeExecute(), dxfeed.makeWSHandler(), dxfeed.endpointSelector),
}
