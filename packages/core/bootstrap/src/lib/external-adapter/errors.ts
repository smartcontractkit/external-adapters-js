import { AdapterErrorResponse } from '@chainlink/types'

export class AdapterError extends Error {
  jobRunID: string
  status: string
  statusCode: number
  name: string
  message: string
  cause: any
  pending?: boolean

  constructor({
    jobRunID = '1',
    status = 'errored',
    statusCode = 500,
    name = 'AdapterError',
    message = 'An error occurred.',
    pending,
    cause,
  }: Partial<AdapterError>) {
    super(message)

    this.jobRunID = jobRunID
    this.status = status
    this.statusCode = statusCode
    this.name = name
    this.message = message
    this.cause = cause
    this.pending = pending
  }

  toJSONResponse(): AdapterErrorResponse {
    const showDebugInfo = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true'
    const errorBasic = { name: this.name, message: this.message }
    const errorFull = { ...errorBasic, stack: this.stack, cause: this.cause }
    return {
      jobRunID: this.jobRunID,
      status: this.status,
      statusCode: this.statusCode,
      error: showDebugInfo ? errorFull : errorBasic,
    }
  }
}
