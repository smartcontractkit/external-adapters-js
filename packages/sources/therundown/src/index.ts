import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'THERUNDOWN'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
