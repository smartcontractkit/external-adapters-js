class AdapterError extends Error {
  constructor({
    jobRunID = '1',
    status = 'errored',
    statusCode = 500,
    name = 'AdapterError',
    message = 'An error occurred.',
    cause,
  }) {
    super(message)
    Error.captureStackTrace(this, AdapterError)

    this.jobRunID = jobRunID
    this.status = status
    this.statusCode = statusCode
    this.name = name
    this.message = message
    this.cause = cause
  }

  toJSONResponse() {
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

exports.AdapterError = AdapterError
