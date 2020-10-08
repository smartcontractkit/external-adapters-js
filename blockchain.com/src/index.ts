import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

export = expose(execute)
