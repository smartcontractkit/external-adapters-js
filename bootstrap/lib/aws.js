const {
  HEADER_CONTENT_TYPE,
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_TEXT_PLAIN,
} = require('./server')
const {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} = require('./errors')

const awsGetRequestHeaders = (event) => {
  if (!event || !event.headers) return {}

  const initialHeader =
    event.version === '2.0' && Array.isArray(event.cookies)
      ? { cookie: event.cookies.join('; ') }
      : {}

  return Object.keys(event.headers).reduce((headers, key) => {
    headers[key.toLowerCase()] = event.headers[key]
    return headers
  }, initialHeader)
}

const isContentTypeSupported = (event) => {
  const headers = awsGetRequestHeaders(event)
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
exports.initHandlerREST = (execute) => (event, _context, callback) => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }

  execute(event, (_statusCode, data) => {
    callback(null, data)
  })
}

// To be used with AWS HTTP API Gateway
exports.initHandlerHTTP = (execute) => (event, _context, callback) => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }

  execute(JSON.parse(event.body), (statusCode, data) => {
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
