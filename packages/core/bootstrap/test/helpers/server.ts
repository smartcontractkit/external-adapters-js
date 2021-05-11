import express, { Application } from 'express'
import { Server as HTTPServer } from 'http'

export const SUCCESS_RESPONSE = {
  result: 'success',
  value: 1,
}
export const SUCCESS_ARRAY_RESPONSE = ['1']

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

  start(): void {
    this.app.get('/', (_, res) => {
      res.status(200).json(SUCCESS_RESPONSE)
    })

    this.app.get('/successArray', (_, res) => {
      res.status(200).send(SUCCESS_ARRAY_RESPONSE)
    })

    this.app.get('/error', (_, res) => {
      this.errorCount++
      res.status(500).send('There was an error')
    })

    this.app.get('/errorsTwice', (_, res) => {
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

    this.app.get('/customError', (_, res) => {
      this.errorCount++
      res.status(200).json({
        result: 'error',
        value: 1,
      })
    })

    this.server = this.app.listen(this.port)
  }

  stop(callback?: (err?: Error | undefined) => void): void {
    if (this.server) this.server.close(callback)
  }

  reset(): void {
    this.errorCount = 0
  }
}
