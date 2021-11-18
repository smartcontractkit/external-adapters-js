import nock from 'nock'

const validTigerWebResponse = {
  displayFieldName: 'BASENAME',
  fieldAliases: {
    STATE: 'STATE',
  },
  fields: [
    {
      name: 'STATE',
      type: 'esriFieldTypeString',
      alias: 'STATE',
      length: 2,
    },
  ],
  features: [
    {
      attributes: {
        STATE: '06',
      },
    },
  ],
}

export const mockResponseWithInvalidLatitude = () => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/82/query')
    .query((query) => true)
    .reply(200, (_, request) => ({
      displayFieldName: 'NAME',
      fieldAliases: {
        CSA: 'CSA',
      },
      fields: [
        {
          name: 'CSA',
          type: 'esriFieldTypeString',
          alias: 'CSA',
          length: 3,
        },
      ],
      features: [],
    }))

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(400, (_, request) => 'Should not reach this nock')
}

export const mockResponseWithInvalidVariable = () => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/82/query')
    .query((query) => true)
    .reply(200, (_, request) => validTigerWebResponse)

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(400, (_, request) => "error: error: unknown variable 'B250301_001E'")
}

export const mockSuccessResponse = () => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/82/query')
    .query((query) => true)
    .reply(200, (_, request) => validTigerWebResponse)

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(200, (_, request) => [
      ['NAME', 'B25001_001E', 'B25002_002E', 'state'],
      ['California', '14175976', '13044266', '06'],
    ])
}

export const mockAlternativeSuccessResponse = () => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/82/query')
    .query((query) => true)
    .reply(200, (_, request) => validTigerWebResponse)

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(200, (_, request) => [
      ['NAME', 'B08101_001E', 'B08101_017E', 'B08101_025E', 'B08101_033E', 'state'],
      ['California', '18191555', '1841632', '923834', '476291', '06'],
    ])
}

export const mockNewYorkStateSuccessResponse = () => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/8/query')
    .query((query) => true)
    .reply(200, (_, request) => ({
      displayFieldName: 'BASENAME',
      fieldAliases: {
        STATE: 'STATE',
        COUNTY: 'COUNTY',
        TRACT: 'TRACT',
      },
      fields: [
        {
          name: 'STATE',
          type: 'esriFieldTypeString',
          alias: 'STATE',
          length: 2,
        },
        {
          name: 'COUNTY',
          type: 'esriFieldTypeString',
          alias: 'COUNTY',
          length: 3,
        },
        {
          name: 'TRACT',
          type: 'esriFieldTypeString',
          alias: 'TRACT',
          length: 6,
        },
      ],
      features: [
        {
          attributes: {
            STATE: '36',
            COUNTY: '081',
            TRACT: '019900',
          },
        },
      ],
    }))

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(200, (_, request) => [
      [
        'NAME',
        'B19001_001E',
        'B19001_002E',
        'B19001_003E',
        'B19001_004E',
        'B19001_005E',
        'B19001_006E',
        'B19001_007E',
        'B19001_008E',
        'B19001_009E',
        'B19001_010E',
        'B19001_011E',
        'B19001_012E',
        'B19001_013E',
        'B19001_014E',
        'B19001_015E',
        'B19001_016E',
        'B19001_017E',
        'state',
        'county',
        'tract',
      ],
      [
        'Census Tract 199, Queens County, New York',
        '162',
        '9',
        '41',
        '0',
        '22',
        '4',
        '0',
        '0',
        '10',
        '3',
        '6',
        '25',
        '27',
        '0',
        '0',
        '9',
        '6',
        '36',
        '081',
        '019900',
      ],
    ])
}
