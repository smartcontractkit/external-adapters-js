import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { mockSandbox } from './fixtures'

describe('execute', () => {
  const id = '1'

  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    SIGNATURE_CHECK: 'true',
    SECRETS_DECRYPTION_PRIVATE_KEY:
      '0x09768a19def4dce2b6793d7dc807828ef47b681709cf1005627a93f0da9c8065',
    SANDBOX_URL: 'http://faassandbox.com/execute',
    SANDBOX_PRIVATE_AUTH_KEY:
      'MIIEpQIBAAKCAQEAwbgb+Pj1t0Y5O1Z8kxblzCZYKXCkVJ3OBuEmdEeQXraICVGEF5K8biZqtvATzQ280T6/+Vv+9PRzBada7CfzCGPJu/aN9xIeUZVmqxTQdvh1M2WC+mgGihGsc2gMpcJ+7NkT4h6wuTkBdKHmB55r7J0fHW/xMjAjKvWo9UNvlX+okEOfY2Kl/c8f2H/EbIYFw4y5DxKbrt0tojVSmW1+abVmmsail2Ak7LCQDz38xFPrAWB0Z8yv4MXW7jWzr5yPy9UBNHARRxQEHo7zxk4/XZ7YPz2r7FXsm6Nc4zC0KnaviWaNnPMSz61d7d59TASEZUehzmFtudP/HuWx8uf2nQIDAQABAoIBAEG5UCxBc0RSG/rI1g0leKOx4rl0kRxwScVFwEE1QoMP1MmskW9aBnosqIoWm/E3Fve7HXDhyHedNCUX6Z4z053mFTyjYvkPeZ/eW23x6uRiWYktiKmif416f5LMG3ZlraB36eoO1ZCSCa9jemLdWep2SGc5YpDPii76F+/WiFYk2Yks5zPMXFs/qfAW4P6RxV/CZxyhkqSW0T6SZBtRTEoksxrcDOjANCqTN2X8OD8ggCRq4dK589l2jbFbiqiJ9cKzFGixcn1QrfNW4SDHLkIXbyX4IQDPzYXKKa5D+cTE4kbjRweJl6CsJxJUZvKdsNxnK4zhCEaICK7Lf523BTUCgYEA5C2smo1q8aDqDWp1VXIzjUSm+pf3W8yTSwbM8Pl8APCtc9F+/XisuD4nobFHNI5h3E6c5cjb+dY/qaUvBsMwWVjPWDV95qZlH629VotxKw2IBIpNrnxodx1EKRZ/28byzoUgpvy6pTQWSm4gZBvPqJHnnj7gYC58yBEBrfbmDVsCgYEA2VbUZ2TOv+pQPIObgEntqQHIu1VOidsEtAT6ZdGqOhGAu34YgBheAfpzIAWdXdK28dLc6CRTSyVnOiWP6i9vWja6dwq8wPvPQ9E72rE6pe5SMt8qVB9EXp8J+ZJMhGyyAERCDm4D0lXVRj6SRnhgYqKAGiwaNq/G52Uo9ucadWcCgYEAo0pcXy4c/lYdqQQqe7+CTPJ4XJUsG7HHJsXzG/AuYa3bMysVKeeWEzPHwNrRDjdmqPZJKdgYNC6y2ICxqrE8hHQdzg5Zzxn8/DKlcK3RivHgCP/An8HAMJ3tDUpgrbMuR8TVnSr3lwozeYhd/cY5UXU4v/JXN/2MptAk1439DEkCgYEAnGwh80hahUXe+a6+/FY49qqSDkIXhKBdgjMTBLUiDykJvefDOm5POp1GvoVL/XrqsKFS3MFIMY15/h+KtMHvIr7A9WyE7WBOjEDLE1r7GvGrt3FmxaS7UF6mjzj8WVLhyc9Wu4vytC+SkDv4iz+YH2VVTYDwXOul/GSSVyF9qYECgYEAtCV7NiYYyjE0zzGg7czhPxxW+ummVBmLrqbz0DdHROhdNow8GhMSf8s/+Yneb+imx2zQSfnK2kmSVQrYge3aG1vrWOsTcn4Z5DQepJDXl0YYDFw/t2uLPC+/XsvBTPZf9y47EMk/0WASkogSQJ5OJjuvE1bXRCGyp8T/HO3uGjU=',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('successful requests', () => {
    it('should return success for basic request', async () => {
      mockSandbox()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({ id, data: { source: "return '0x01'" } })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toBe('0x01')
    })

    it('should return success for request with HTTP requests & args', async () => {
      mockSandbox()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            queries: [
              {
                url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
              },
              {
                url: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
              },
            ],
            source: "return '0x02'",
            args: ['bitcoin', 'usd', 'btc-bitcoin'],
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toBe('0x02')
    })

    it('should return success for request with secrets', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            secrets:
              'GVE1I4VF1yXLFpl/kjlTLALD9asKKa6tB2BYHw3KGY1lB8VZQS0A37ebQYZ75sAAfM26Qh6X1WCOBJ7357TwQmnF/6uUxXf0+WzWAZ4LTsi+hY3ZHW8I6A+dfFWP2wdv5DvlrZt0NC9YYcwYN+Z3t7veSrIKxIWg9Szg1o7PJcHXGOkiPhfMt8/RlXtBuD8Zj4yudx4gT/MgUwsrtTeDkuy/242QHIGcE3aXKLhsIIaEVSAMUYR1qjlR9EMjCbNXfKyelRERKAuzhsVDIOSTsTPnznexgUnBg5kMNpl4WJYCfKFIngL8P1IU3Zfo1i/9a0Z6JmamEqcNOwy+svVcC5JaNgL+csciIgNeIx3LAXyG',
            secretsOwner: '0xFEad1807bd62618f33770FeB34D37D32FbB4479F',
            source: 'return secrets.test',
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toBe('0x64')
    })
  })

  describe('error in provided JavaScript', () => {
    it('should return syntax error', async () => {
      mockSandbox()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({ id, data: { source: 'return )' } })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.error).toBe(
        '0x4a6176615363726970742053796e746178204572726f723a20556e657870656374656420746f6b656e20272927',
      )
    })

    it('should return error if an invalid type is returned from sandbox', async () => {
      mockSandbox()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({ id, data: { source: 'return 1' } })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.errorString).toBe('source code did not return a valid hex string')
    })

    it('should return error if the returned hex string is too long', async () => {
      mockSandbox()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            source:
              "return '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'",
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.data.errorString).toBe(
        'returned hex string is longer than 130 characters',
      )
    })

    it('should return error if secrets signature is invalid', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            secrets:
              'GVE1I4VF1yXLFpl/kjlTLALD9asKKa6tB2BYHw3KGY1lB8VZQS0A37ebQYZ75sAAfM26Qh6X1WCOBJ7357TwQmnF/6uUxXf0+WzWAZ4LTsi+hY3ZHW8I6A+dfFWP2wdv5DvlrZt0NC9YYcwYN+Z3t7veSrIKxIWg9Szg1o7PJcHXGOkiPhfMt8/RlXtBuD8Zj4yudx4gT/MgUwsrtTeDkuy/242QHIGcE3aXKLhsIIaEVSAMUYR1qjlR9EMjCbNXfKyelRERKAuzhsVDIOSTsTPnznexgUnBg5kMNpl4WJYCfKFIngL8P1IU3Zfo1i/9a0Z6JmamEqcNOwy+svVcC5JaNgL+csciIgNeIx3LAXyG',
            secretsOwner: '0x04676cd28EDC55A96d2f074E92e9A92d0C2Ad7BD',
            source: 'return secrets.test',
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.data.errorString).toBe('encrypted secrets not signed by secrets owner')
    })

    it('should return error if encrypted secrets are invalid', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            secrets:
              'nQHNqjf8U9SHKrb4ggP7ICDIWxrrZQwn46qhmEDFZtJZP6+iQJP5bUGifBWUGUtiUOkhOpIFLsZtAgJkE0NlXiJVWs02/s+9PfXSZBjLkRyD2QN3X+TY4yTsXEVD3pWp6ybEp6Eik5FWCUScRkh/EXRd4VJbexzGM3StxTYBqaRgcKsdR/lkRg+Ku6kiIVxMZ5EaYJi2OcNFg1Vm2V71d3vv4gf+E7G0cCY13lJ9skS2I8OA5A99EIFgPzt2fY++z/vdhMhaF3gOe94UoK0zj/WNwoxnRf7/ocOE+5nUksiHyzT92YqQWGJ6RgvXT4U96Tq+eH9jbGGCfVTdEzZRPX6lYZs6nQKlkSrk2TIT',
            secretsOwner: '0xFEad1807bd62618f33770FeB34D37D32FbB4479F',
            source: 'return secrets.test',
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.data.errorString).toBe('encrypted secrets are invalid')
    })

    it('should return error if decrypted secrets are not a valid JSON string', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send({
          id,
          data: {
            secrets:
              'h44CnQHNqjf8U9SHKrb4ggP7ICDIWxrrZQwn46qhmEDFZtJZP6+iQJP5bUGifBWUGUtiUOkhOpIFLsZtAgJkE0NlXiJVWs02/s+9PfXSZBjLkRyD2QN3X+TY4yTsXEVD3pWp6ybEp6Eik5FWCUScRkh/EXRd4VJbexzGM3StxTYBqaRgcKsdR/lkRg+Ku6kiIVxMZ5EaYJi2OcNFg1Vm2V71d3vv4gf+E7G0cCY13lJ9skS2I8OA5A99EIFgPzt2fY++z/vdhMhaF3gOe94UoK0zj/WNwoxnRf7/ocOE+5nUksiHyzT92YqQWGJ6RgvXT4U96Tq+eH9jbGGCfVTdEzZRPX6lYZs6nQKlkSrk2TIT',
            secretsOwner: '0xFEad1807bd62618f33770FeB34D37D32FbB4479F',
            source: 'return secrets.test',
          },
        })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.data.errorString).toBe('decrypted secrets are not a valid JSON string')
    })
  })
})
