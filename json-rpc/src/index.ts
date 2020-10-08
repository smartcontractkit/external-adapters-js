import { expose } from '@chainlink/ea-bootstrap'
import { executeSync } from './adapter'
// TODO: export config
// import * as config from './config'

export = expose(executeSync)
