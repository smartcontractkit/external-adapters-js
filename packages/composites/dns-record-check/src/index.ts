import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute())
export { makeExecute, server }
