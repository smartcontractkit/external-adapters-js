import { cryptoapis } from '@chainlink/ea'
;(async () => {
  console.log(await cryptoapis.price('USD', 'EUR'))
})()
