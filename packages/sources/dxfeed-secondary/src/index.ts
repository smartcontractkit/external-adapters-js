import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

const NAME_OVERRIDE = 'DXFEED'

export = { NAME, makeExecute, makeConfig, ...expose(NAME_OVERRIDE, makeExecute()) }
