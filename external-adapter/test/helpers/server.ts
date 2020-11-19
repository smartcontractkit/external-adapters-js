import express, { Application } from 'express'
import { Server as HTTPServer } from 'http'

export class Server {
  app: Application
  port: number
  errorCount: number
  server?: HTTPServer

  constructor() {
    this.app = express()
    this.start()
    this.port = 18080
    this.errorCount = 0
  }

  start() {
    this.app.get('/', (req, res) => {
      res.status(200).json({
        result: 'success',
        value: 1,
      })
    })

    this.app.get('/error', (req, res) => {
      this.errorCount++
      res.status(500).send('There was an error')
    })

    this.app.get('/errorsTwice', (req, res) => {
      if (this.errorCount >= 2) {
        res.status(200).json({
          result: 'success',
          value: 1,
        })
      } else {
        this.errorCount++
        res.status(500).send('There was an error')
      }
    })

    this.app.get('/customError', (req, res) => {
      this.errorCount++
      res.status(200).json({
        result: 'error',
        value: 1,
      })
    })

    this.server = this.app.listen(this.port, () => {})
  }

  stop(fn = () => {}) {
    if (this.server) this.server.close(fn)
  }

  reset() {
    this.errorCount = 0
  }
}
