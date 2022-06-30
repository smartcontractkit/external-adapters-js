import type { AdapterErrorResponse } from '../../types'
import { HttpRequestType } from '../metrics/constants'
import { getEnv } from '../util'

export class AdapterError extends Error {
  jobRunID: string
  status: string
  statusCode: number
  name: string
  message: string
  cause: Error | undefined
  url?: string
  errorResponse: unknown
  feedID?: string
  providerStatusCode?: number
  network?: string
  metricsLabel: HttpRequestType

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
    network,
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
    this.network = network
    this.metricsLabel = HttpRequestType.ADAPTER_ERROR
  }

  toJSONResponse(): AdapterErrorResponse {
    const showDebugInfo = getEnv('NODE_ENV') === 'development' || getEnv('DEBUG') === 'true'
    const errorBasic = {
      name: this.name,
      message: this.message,
      url: this.url,
      errorResponse: this.errorResponse,
      feedID: this.feedID,
      network: this.network,
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

export class AdapterConfigError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.CONFIG_ERROR
  }
}
export class AdapterInputError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.INPUT_ERROR
  }
}
export class AdapterRateLimitError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.RATE_LIMIT_ERROR
  }
}
export class AdapterBurstLimitError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.BURST_LIMIT_ERROR
  }
}
export class AdapterBackoffError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.BACKOFF_ERROR
  }
}
export class AdapterOverriderError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.OVERRIDES_ERROR
  }
}
export class AdapterValidationError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.VALIDATION_ERROR
  }
}
export class AdapterTimeoutError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.TIMEOUT_ERROR
  }
}
export class AdapterConnectionError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.CONNECTION_ERROR
  }
}
export class AdapterDataProviderError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.DP_ERROR
  }
}
export class AdapterResponseEmptyError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.RES_EMPTY_ERROR
  }
}
export class AdapterResponseInvalidError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.RES_INVALID_ERROR
  }
}
export class AdapterCustomError extends AdapterError {
  constructor(input: Partial<AdapterError>) {
    super(input)
    this.metricsLabel = HttpRequestType.CUSTOM_ERROR
  }
}
// Custom error for required env variable. For metrics purposes, this also counts as a config error
export class RequiredEnvError extends AdapterConfigError {
  metricsLabel: HttpRequestType
  constructor(name: string) {
    super({ name: RequiredEnvError.name, message: `Please set the required env ${name}.` })
    this.metricsLabel = HttpRequestType.CONFIG_ERROR
  }
}
