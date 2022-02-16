import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'
import { NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, execute)
export { NAME, execute, server }
