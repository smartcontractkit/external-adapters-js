import nock from 'nock'

export const mockDnsProofResponseError = (): nock.Scope =>
  nock('https://dns.google', {
    encodedQueryParams: true,
  })
    .get('/resolve')
    .query({ name: 'www5.infernos.io', type: 'TXT' })
    .reply(500, {})

export const mockDnsProofResponseSuccessMalformed = (): nock.Scope =>
  nock('https://dns.google', {
    encodedQueryParams: true,
  })
    .get('/resolve')
    .query({ name: 'www5.infernos.io', type: 'TXT' })
    .reply(200, {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Question: [
        {
          name: 'www5.infernos.io.',
          type: 16,
        },
      ],
      Answer: 'linkpool',
      Comment: 'Response from 2a06:98c1:50::ac40:2075.',
    })

export const mockDnsProofResponseSuccess = (): nock.Scope =>
  nock('https://dns.google', {
    encodedQueryParams: true,
  })
    .get('/resolve')
    .query({ name: 'www5.infernos.io', type: 'TXT' })
    .reply(200, {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Question: [
        {
          name: 'www5.infernos.io.',
          type: 16,
        },
      ],
      Answer: [
        {
          name: 'www5.infernos.io.',
          type: 16,
          TTL: 300,
          data: '0x2ffb3d72fa6af12af5d378df0697a2bf9f45652e',
        },
        {
          name: 'www5.infernos.io.',
          type: 16,
          TTL: 300,
          data: '0x4d3407ddfdeb3feb4e8a167484701aced7056826',
        },
        {
          name: 'www5.infernos.io.',
          type: 16,
          TTL: 300,
          data: '0xeb9abc589734ce8051f089cf3498e230456a85dd',
        },
        {
          name: 'www5.infernos.io.',
          type: 16,
          TTL: 300,
          data: '0xf75519f611776c22275474151a04183665b7feDe',
        },
      ],
      Comment: 'Response from 2a06:98c1:50::ac40:2075.',
    })
