import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

const adapterContext = { name: NAME }

const handlers = expose(adapterContext, makeExecute())

export { NAME, makeConfig, makeExecute, handlers }
