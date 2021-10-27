import { expose } from '@chainlink/ea-bootstrap'
import * as dxfeed from '@chainlink/dxfeed-adapter'
import { makeConfig, NAME } from './config'

const makeExecute = dxfeed.makeExecute
const { server } = expose(NAME, makeExecute(), dxfeed.makeWSHandler(), dxfeed.endpointSelector)

export { NAME, makeExecute, makeConfig, server }
