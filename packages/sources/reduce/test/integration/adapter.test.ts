import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import * as http from 'http'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('reduce adapter', () => {
    const data: AdapterRequest = {
      id,
      data: {
        reducer: 'sum',
        initialValue: 0,
        dataPath: 'addresses',
        valuePath: 'balance',
        addresses: [
          {
            address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
            coin: 'btc',
            chain: 'mainnet',
            balance: 44900000000,
          },
          {
            address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
            coin: 'btc',
            chain: 'mainnet',
            balance: 9899463044,
          },
          {
            address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
            coin: 'btc',
            chain: 'mainnet',
            balance: 307499838499,
          },
          {
            address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
            coin: 'btc',
            chain: 'mainnet',
            balance: 904070305884,
          },
          {
            address: '3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT',
            coin: 'btc',
            chain: 'mainnet',
            balance: 80000,
          },
          {
            address: '3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth',
            coin: 'btc',
            chain: 'mainnet',
            balance: 264148085712,
          },
          {
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
            coin: 'btc',
            chain: 'mainnet',
            balance: 2601100000,
          },
        ],
      },
    }

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
