const express = require('express')
const app = express()
const port = 18081

app.get('/price', (req, res) => {
  const response = {
    Response: 'Success',
    price: 77777.77
  }
  if (!(req.query.base === 'ETH' && req.query.quote === 'USD')) {
    response.Response = 'Error'
  }
  res.status(200).json(response)
})

app.listen(port, () => {})
