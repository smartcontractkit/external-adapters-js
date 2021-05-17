import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'MARKET_CLOSURE'
const handlers = expose(makeExecute())

export { NAME, makeExecute, makeConfig, handlers }
