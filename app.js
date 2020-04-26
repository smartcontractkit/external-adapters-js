const createRequest = require('./adapter').createRequest
const marketStatusRequest = require('./market-status').marketStatusRequest

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json())

app.post('/', (req, res) => {
  console.log('POST Data: ', req.body)

  if ((process.env.CHECK_MARKET_STATUS || '').toLowerCase() !== 'true') {
    createRequest(req.body, (status, result) => {
      console.log('Result: ', result)
      res.status(status).json(result)
    })
  } else {
    console.log('Checking market status first...')
    marketStatusRequest(req.body, createRequest, (status, result) => {
      console.log('Result: ', result)
      res.status(status).json(result)
    })
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))

process.on('SIGINT', () => {
  process.exit()
})
