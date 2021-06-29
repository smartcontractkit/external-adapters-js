import { expose } from '@chainlink/ea-bootstrap'
import { execute, NAME } from './adapter'

export = { NAME, execute, ...expose(execute) }
