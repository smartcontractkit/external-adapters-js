const consul = require('consul')({host: 'consul.mgnt.devnet.tools'})
const express = require('express')
const bodyParser = require('body-parser')

const pjson = require(path.join(process.cwd(), 'package.json'))

const port = process.env.EA_PORT || 8080
const app = express()

function init (createRequest) {
  const consulOptions = {
    name: `${pjson.name}`,
    tags: ['external-adapter', 'fargate', `version-${pjson.version}`],
    port: port,
  }

  return () => {
    consul.agent.service.register(consulOptions, err => {
      if (err) {
        console.error('Could not register service', err);
        throw err
      } else {
        console.log(`Registered External Adapter '${consulOptions.name}' ${pjson.version} with Consul`);
      }
    })

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
      consul.agent.service.deregister(consulOptions, err => {
        if (err) {
          console.error('Failed to deregister with consul on shutdown', err);
        }
      })
      process.exit()
    })
  }
}

module.exports = {
  init
}
