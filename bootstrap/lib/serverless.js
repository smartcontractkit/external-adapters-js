exports.initGcpService = (execute) => (req, res) => {
  execute(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.initHandler = (execute) => (event, _context, callback) => {
  execute(event, (_statusCode, data) => {
    callback(null, data)
  })
}

exports.initHandlerV2 = (execute) => (event, _context, callback) => {
  execute(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    })
  })
}
