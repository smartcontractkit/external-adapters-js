import nock from 'nock'

const validTigerWebResponse = {
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
  features: [
    {
      attributes: {
        CSA: '488',
      },
    },
  ],
}

export const mockResponseWithInvalidLatitude = (apikey: string) => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/74/query')
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

export const mockResponseWithInvalidVariable = (apikey: string) => {
  nock('https://tigerweb.geo.census.gov', { encodedQueryParams: true })
    .get('/arcgis/rest/services/TIGERweb/tigerWMS_ACS2019/MapServer/74/query')
    .query((query) => true)
    .reply(200, (_, request) => validTigerWebResponse)

  nock('https://api.census.gov', { encodedQueryParams: true })
    .get('/data/2019/acs/acs5')
    .query((query) => true)
    .reply(400, (_, request) => "error: error: unknown variable 'B250301_001E'")
}
