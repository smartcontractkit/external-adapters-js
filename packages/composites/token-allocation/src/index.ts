import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'
import * as types from './types'

const adapterContext = { name: NAME }

const handlers = expose(adapterContext, makeExecute())

export { NAME, types, makeExecute, makeConfig, handlers }
