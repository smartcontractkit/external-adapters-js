import { expose } from '@chainlink/ea-bootstrap'
import * as dxfeed from '@chainlink/dxfeed-adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const makeExecute = dxfeed.makeExecute
const { server } = expose(
  adapterContext,
  makeExecute(makeConfig()),
  dxfeed.makeWSHandler(),
  dxfeed.endpointSelector,
)

const endpoints = dxfeed.endpoints

export { NAME, endpoints, makeExecute, makeConfig, server }
