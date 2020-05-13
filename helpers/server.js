const express = require('express')
const app = express()
const port = 18081

app.get('/price', (req, res) => {
  res.status(200).json({
    price: 77777.77
  })
})

app.listen(port, () => {})
