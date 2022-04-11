import { AdapterErrorResponse } from '@chainlink/types'
import { getEnv } from '../util'

export class AdapterError extends Error {
  jobRunID: string
  status: string
  statusCode: number
  name: string
  message: string
  cause: any
  url?: string
  errorResponse: any
  feedID?: string
  providerStatusCode?: number

  constructor({
    jobRunID = '1',
    status = 'errored',
    statusCode = 500,
    name = 'AdapterError',
    message = 'An error occurred.',
    cause,
    url,
    errorResponse,
    feedID,
    providerStatusCode,
  }: Partial<AdapterError>) {
    super(message)

    this.jobRunID = jobRunID
    this.status = status
    this.statusCode = statusCode
    this.name = name
    this.message = message
    this.cause = cause
    if (url) {
      this.url = url
    }
    if (feedID) {
      this.feedID = feedID
    }
    this.errorResponse = errorResponse
    this.providerStatusCode = providerStatusCode
  }

  toJSONResponse(): AdapterErrorResponse {
    const showDebugInfo = getEnv('NODE_ENV') === 'development' || getEnv('DEBUG') === 'true'
    const errorBasic = {
      name: this.name,
      message: this.message,
      url: this.url,
      errorResponse: this.errorResponse,
      feedID: this.feedID,
    }
    const errorFull = { ...errorBasic, stack: this.stack, cause: this.cause }
    return {
      jobRunID: this.jobRunID,
      status: this.status,
      statusCode: this.statusCode,
      providerStatusCode: this.providerStatusCode,
      error: showDebugInfo ? errorFull : errorBasic,
    }
  }
}
