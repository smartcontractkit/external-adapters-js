import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'
import { makeExecute } from './adapter'

const adapterContext = { name: NAME }

const handlers = expose(adapterContext, makeExecute())

export = { NAME, makeExecute, makeConfig, handlers }
