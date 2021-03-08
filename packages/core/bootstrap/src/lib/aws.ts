import { ExecuteSync } from '@chainlink/types'
import {
  HEADER_CONTENT_TYPE,
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_TEXT_PLAIN,
} from './server'
import {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { toObjectWithNumbers } from './util'

const awsGetRequestHeaders = (event: any) => {
  if (!event || !event.headers) return {}

  const initialHeader =
    event.version === '2.0' && Array.isArray(event.cookies)
      ? { cookie: event.cookies.join('; ') }
      : {}

  return Object.keys(event.headers).reduce((headers: any, key) => {
    headers[key.toLowerCase()] = event.headers[key]
    return headers
  }, initialHeader)
}

const isContentTypeSupported = (event: any) => {
  const headers: any = awsGetRequestHeaders(event)
  const contentTypeKey = HEADER_CONTENT_TYPE.toLowerCase()
  return !(
    headers &&
    headers[contentTypeKey] &&
    headers[contentTypeKey] !== CONTENT_TYPE_APPLICATION_JSON
  )
}

const UNSUPPORTED_MEDIA_TYPE_RESPONSE = {
  statusCode: HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  headers: {
    [HEADER_CONTENT_TYPE]: CONTENT_TYPE_TEXT_PLAIN,
  },
  body: HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
  isBase64Encoded: false,
}

// To be used with AWS REST API Gateway
export const initHandlerREST = (execute: ExecuteSync) => (
  event: any,
  _context: any,
  callback: any,
): void => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }
  event.data = {
    ...event.data,
    ...toObjectWithNumbers(event.queryStringParameters || {}),
  }
  execute(event, (_, data) => {
    callback(null, data)
  })
}

// To be used with AWS HTTP API Gateway
export const initHandlerHTTP = (execute: ExecuteSync) => (
  event: any,
  _context: any,
  callback: any,
): void => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }
  const body = JSON.parse(event.body)
  body.data = {
    ...body.data,
    ...toObjectWithNumbers(body.queryStringParameters || {}),
  }
  execute(body, (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      headers: {
        [HEADER_CONTENT_TYPE]: CONTENT_TYPE_APPLICATION_JSON,
      },
      isBase64Encoded: false,
    })
  })
}
