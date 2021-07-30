import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'XBTO'

export = { NAME, makeExecute, makeConfig, ...expose(NAME, makeExecute()) }
