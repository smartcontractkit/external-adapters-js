import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'REFERENCE_TRANSFORM'

const handlers = expose(makeExecute())

export = { NAME, makeConfig, makeExecute, handlers }
