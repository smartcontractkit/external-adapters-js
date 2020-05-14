const pjson = require(path.join(process.cwd(), 'package.json'))
const withConsul = require('with-consul')
const express = require('express')
const bodyParser = require('body-parser')
const port = process.env.EA_PORT || 8080

const app = withConsul(express(), {
  name: `${pjson.name}`,
  tags: ['external-adapter', 'fargate', `version-${pjson.version}`]
})

function init (createRequest) {
  return () => {
    app.use(bodyParser.json())

    app.post('/', (req, res) => {
      console.log('POST Data: ', req.body)
      createRequest(req.body, (status, result) => {
        console.log('Result: ', result)
        res.status(status).json(result)
      })
    })

    app.listen(port, () => console.log(`Listening on port ${port}!`))

    process.on('SIGINT', () => {
      process.exit()
    })
  }
}

module.exports = {
  init
}
