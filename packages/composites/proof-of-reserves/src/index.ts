import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'PROOF_OF_RESERVES'

const handlers = expose(makeExecute())

export = { NAME, makeConfig, makeExecute, handlers }
