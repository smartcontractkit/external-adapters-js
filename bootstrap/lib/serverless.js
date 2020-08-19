exports.initGcpService = (createRequest) => (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.initHandler = (createRequest) => (event, _context, callback) => {
  createRequest(event, (_statusCode, data) => {
    callback(null, data)
  })
}

exports.initHandlerV2 = (createRequest) => (event, _context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    })
  })
}
