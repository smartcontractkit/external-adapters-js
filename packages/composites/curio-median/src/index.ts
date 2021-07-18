import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'CURIO_MEDIAN'

export = { NAME, makeExecute, ...expose(makeExecute()) }
