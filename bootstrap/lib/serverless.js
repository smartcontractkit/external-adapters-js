const {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} = require('./errors')

const HEADER_CONTENT_TYPE = 'content-type'
const CONTENT_TYPE_APPLICATION_JSON = 'application/json'

exports.initGcpService = (execute) => (req, res) => {
  if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
    return res
      .type('text/plain')
      .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
      .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
  }

  execute(req.body, (statusCode, data) => {
    res
      .type('json')
      .status(statusCode)
      .send(data)
  })
}

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
  return !(
    headers &&
    headers[HEADER_CONTENT_TYPE] &&
    headers[HEADER_CONTENT_TYPE] !== CONTENT_TYPE_APPLICATION_JSON
  )
}

const UNSUPPORTED_MEDIA_TYPE_RESPONSE = {
  statusCode: HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  headers: {
    'Content-Type': 'text/plain',
  },
  body: HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
  isBase64Encoded: false,
}

exports.initHandler = (execute) => (event, _context, callback) => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }

  execute(event, (_statusCode, data) => {
    callback(null, data)
  })
}

exports.initHandlerV2 = (execute) => (event, _context, callback) => {
  if (!isContentTypeSupported(event)) {
    return callback(null, UNSUPPORTED_MEDIA_TYPE_RESPONSE)
  }

  execute(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      isBase64Encoded: false,
    })
  })
}
