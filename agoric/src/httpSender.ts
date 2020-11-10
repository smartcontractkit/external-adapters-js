import { URL } from 'url'
import http from 'http'

export type HTTPSender = (obj: { type: string; data: unknown }) => Promise<number>

export const makeHTTPSender: (url: string) => HTTPSender = (url) => {
  const urlObj = new URL(url)
  return (obj) =>
    new Promise((resolve, reject) => {
      const data = JSON.stringify(obj)
      const req = http.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
          },
        },
        (res) => {
          if (res.statusCode === 200) {
            resolve(res.statusCode)
          } else {
            reject(res.statusCode)
          }
        },
      )
      req.on('error', reject)
      req.write(data)
      req.end()
    })
}
