import * as bootstrap from '@chainlink/ea-bootstrap'
import { createRequest } from './adapter'

export const server = bootstrap.server.init(createRequest)
export const gcpservice = bootstrap.serverless.initGcpService(createRequest)
export const handler = bootstrap.serverless.initHandler(createRequest)
export const handlerv2 = bootstrap.serverless.initHandlerV2(createRequest)
