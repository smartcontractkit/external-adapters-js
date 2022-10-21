import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'
import { makeExecute } from './adapter'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute())

export { NAME, makeExecute, makeConfig, server }
