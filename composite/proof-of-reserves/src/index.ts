import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './feed'

export = { execute, ...expose(execute) }
