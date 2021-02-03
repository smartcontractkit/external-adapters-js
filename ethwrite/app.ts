import { createRequest } from './index'

import express from 'express'
import bodyParser from 'body-parser'
const app = express()
const port = process.env.EA_PORT || 3000

app.use(bodyParser.json())

app.post('/', (req, res) => {
  console.log('POST Data: ', req.body)
  createRequest(req.body, (status: any, result: any) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
