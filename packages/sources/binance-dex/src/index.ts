import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'BINANCE_DEX'

const { server } = expose(NAME, makeExecute())
export { NAME, makeExecute, makeConfig, server }
