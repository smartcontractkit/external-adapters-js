import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/multi-http'
import { GenericApiSubscriptionTransport } from './utils'

const logger = makeLogger('Multi HTTP Transport')

// This was originally an HTTP transport and we wanted to keep the same
// endpoint.
export class MultiHttpTransport extends GenericApiSubscriptionTransport<BaseEndpointTypes> {
  constructor() {
    super({
      logger,
      mapParam: (p) => p,
      mapResponse: (adapterResponse) => adapterResponse,
    })
  }
}

export const multiHttpTransport = new MultiHttpTransport()
