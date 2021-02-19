import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'COINMARKETCAP'

export = { NAME, makeExecute, ...expose(makeExecute()) }
