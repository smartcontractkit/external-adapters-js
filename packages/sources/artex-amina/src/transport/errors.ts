import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'

export interface AminaErrorResponse {
  title?: string
  instance?: string
}

const MAX_ERROR_FIELD_LENGTH = 200
const SECRET_PATTERN =
  /(?:authorization|bearer|signature|password|passwd|secret|token|hmac|api[-_]?key|credential)/i

function safeField(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0 || SECRET_PATTERN.test(value)) {
    return undefined
  }
  return value.length > MAX_ERROR_FIELD_LENGTH
    ? `${value.slice(0, MAX_ERROR_FIELD_LENGTH)}...`
    : value
}

export function formatErrorBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const value = body as AminaErrorResponse
  const parts = [safeField(value.title), safeField(value.instance)].filter((part): part is string =>
    Boolean(part),
  )
  return parts.length > 0 ? parts.join(' | ') : undefined
}

export function mapAminaError(error: unknown): AdapterError {
  if (error instanceof AdapterDataProviderError) {
    const status = error.providerStatusCode
    const detail = formatErrorBody(error.errorResponse)
    const statusSuffix = status ? ` (${status})` : ''
    const detailSuffix = detail ? `: ${detail}` : ''
    return new AdapterError({
      statusCode: 502,
      providerStatusCode: status,
      message: `AMINA request failed${statusSuffix}${detailSuffix}`,
    })
  }
  if (error instanceof AdapterConnectionError) {
    return new AdapterError({
      statusCode: 502,
      message: 'AMINA connection failed',
    })
  }
  if (error instanceof AdapterError) {
    return error
  }
  return new AdapterError({
    statusCode: 502,
    message: 'AMINA request failed',
  })
}
