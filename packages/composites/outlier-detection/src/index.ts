import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import { makeExecute } from './adapter'

const NAME = 'OUTLIER-DETECTION'

const handlers = expose(NAME, makeExecute())

export = { NAME, makeExecute, makeConfig, handlers }
