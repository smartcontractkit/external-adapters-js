import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, startService, stopService } from './adapter'
import { makeConfig, NAME } from './config'

const makeExecuteWS = () => {
  const service = startService(makeConfig())
  const response = makeExecute()
  stopService(service)
  return response
}

export = { NAME, makeExecute, makeConfig, ...expose(makeExecuteWS()) }
