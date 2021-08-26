import express from 'express'
import { readFileSync } from 'fs'

const server = express()

function loadResource(pathToResource: string) {
  const buf: string = readFileSync(pathToResource).toString()
  return JSON.parse(buf)
}

function resourcePath(req: express.Request): string {
  return `${__dirname}/test-data${req.path}.json`
}

server.get('*', (req, res) => {
  try {
    const resource = loadResource(resourcePath(req))
    res.json(resource)
  } catch (e) {
    res.send('')
  }
})

export default server
