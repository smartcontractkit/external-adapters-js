import nock from 'nock'

// *** endpoint: location ***

export const mockAWLocationResponseError = (): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get('/locations/v1/geoposition/search.json')
    .query({
      q: '40.78136100040876,-77.89687509335249',
      apikey: 'test_api_key',
    })
    .reply(500, {})

export const mockAWLocationResponseSuccessMalformed1 = (): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get('/locations/v1/geoposition/search.json')
    .query({
      q: '40.78136100040876,-77.89687509335249',
      apikey: 'test_api_key',
    })
    .reply(200, {}) // should be an Array

export const mockAWLocationResponseSuccessMalformed2 = (): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get('/locations/v1/geoposition/search.json')
    .query({
      q: '40.78136100040876,-77.89687509335249',
      apikey: 'test_api_key',
    })
    .reply(200, [
      // Location object is missing attributes
      {
        Key: 2097720,
      },
    ])

export const mockAWLocationResponseSuccessLocationNotFound = (): nock.Scope =>
  nock('http://apidev.accuweather.com:80', { encodedQueryParams: true })
    .get('/locations/v1/geoposition/search.json')
    .query({ q: '0%2C0', apikey: 'test_api_key' })
    .reply(
      200,
      [],
      [
        'Content-Type',
        'application/json; charset=utf-8',
        'Request-Context',
        'appId=cid-v1:344a4224-50d7-4742-918c-1f3020bed13d',
        'RateLimit-Limit',
        '1',
        'RateLimit-Remaining',
        '249',
        'Cache-Control',
        'public, max-age=85047',
        'Expires',
        'Sat, 23 Oct 2021 11:23:07 GMT',
        'Date',
        'Fri, 22 Oct 2021 11:45:40 GMT',
        'Content-Length',
        '2',
        'Connection',
        'close',
      ],
    )

export const mockAWLocationResponseSuccessLocationFound = (): nock.Scope =>
  nock('http://apidev.accuweather.com:80', { encodedQueryParams: true })
    .get('/locations/v1/geoposition/search.json')
    .query({
      q: '40.78136100040876%2C-77.89687509335249',
      apikey: 'test_api_key',
    })
    .reply(
      200,
      [
        {
          Version: 1,
          Key: '2097720',
          Type: 'City',
          Rank: 65,
          LocalizedName: 'Park Forest Village',
          EnglishName: 'Park Forest Village',
          PrimaryPostalCode: '16803',
          Region: { ID: 'NAM', LocalizedName: 'North America', EnglishName: 'North America' },
          Country: { ID: 'US', LocalizedName: 'United States', EnglishName: 'United States' },
          AdministrativeArea: {
            ID: 'PA',
            LocalizedName: 'Pennsylvania',
            EnglishName: 'Pennsylvania',
            Level: 1,
            LocalizedType: 'State',
            EnglishType: 'State',
            CountryID: 'US',
          },
          TimeZone: {
            Code: 'EDT',
            Name: 'America/New_York',
            GmtOffset: -4,
            IsDaylightSaving: true,
            NextOffsetChange: '2021-11-07T06:00:00Z',
          },
          GeoPosition: {
            Latitude: 40.807,
            Longitude: -77.917,
            Elevation: {
              Metric: { Value: 427, Unit: 'm', UnitType: 5 },
              Imperial: { Value: 1400, Unit: 'ft', UnitType: 0 },
            },
          },
          IsAlias: false,
          SupplementalAdminAreas: [{ Level: 2, LocalizedName: 'Centre', EnglishName: 'Centre' }],
          DataSets: [
            'AirQualityCurrentConditions',
            'AirQualityForecasts',
            'Alerts',
            'DailyAirQualityForecast',
            'DailyPollenForecast',
            'ForecastConfidence',
            'FutureRadar',
            'MinuteCast',
            'Radar',
          ],
        },
      ],
      [
        'Content-Type',
        'application/json; charset=utf-8',
        'Request-Context',
        'appId=cid-v1:344a4224-50d7-4742-918c-1f3020bed13d',
        'RateLimit-Limit',
        '1',
        'RateLimit-Remaining',
        '249',
        'Cache-Control',
        'public, max-age=83639',
        'Expires',
        'Sat, 23 Oct 2021 11:22:33 GMT',
        'Date',
        'Fri, 22 Oct 2021 12:08:34 GMT',
        'Content-Length',
        '1077',
        'Connection',
        'close',
      ],
    )

// *** endpoint: current-conditions ***

export const mockAWCurrentConditionsResponseError = (locationKey: number): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get(`/currentconditions/v1/${locationKey}.json`)
    .query({ details: 'true', apikey: 'test_api_key' })
    .reply(500, {})

export const mockAWCurrentConditionsResponseSuccessMalformed1 = (locationKey: number): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get(`/currentconditions/v1/${locationKey}.json`)
    .query({ details: 'true', apikey: 'test_api_key' })
    .reply(200, {}) // should be an Array

export const mockAWCurrentConditionsResponseSuccessMalformed2 = (locationKey: number): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get(`/currentconditions/v1/${locationKey}.json`)
    .query({ details: 'true', apikey: 'test_api_key' })
    .reply(200, [
      // Current conditions object is missing attributes
      {
        WeatherIcon: 6,
      },
    ])

export const mockAWCurrentConditionsResponseSuccessMalformed3 = (locationKey: number): nock.Scope =>
  nock('http://apidev.accuweather.com')
    .get(`/currentconditions/v1/${locationKey}.json`)
    .query({ details: 'true', apikey: 'test_api_key' })
    .reply(
      200,
      [
        {
          LocalObservationDateTime: '2021-10-22T08:28:00-04:00',
          EpochTime: 1634905680,
          WeatherText: 'Cloudy',
          WeatherIcon: 7,
          HasPrecipitation: false,
          PrecipitationType: null,
          IsDayTime: true,
          Temperature: {
            Metric: { Value: 'UNEXPECTED_TEMPERATURE', Unit: 'C', UnitType: 17 }, // NaN
            Imperial: { Value: 'UNEXPECTED_TEMPERATURE', Unit: 'F', UnitType: 18 }, // NaN
          },
          RealFeelTemperature: {
            Metric: { Value: 7.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 46, Unit: 'F', UnitType: 18 },
          },
          RealFeelTemperatureShade: {
            Metric: { Value: 7.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 46, Unit: 'F', UnitType: 18 },
          },
          RelativeHumidity: 84,
          IndoorRelativeHumidity: 47,
          DewPoint: {
            Metric: { Value: 8.4, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 47, Unit: 'F', UnitType: 18 },
          },
          Wind: {
            Direction: { Degrees: 270, Localized: 'W', English: 'W' },
            Speed: {
              Metric: { Value: 18.5, Unit: 'km/h', UnitType: 7 },
              Imperial: { Value: 11.5, Unit: 'mi/h', UnitType: 9 },
            },
          },
          WindGust: {
            Speed: {
              Metric: { Value: 18.5, Unit: 'km/h', UnitType: 7 },
              Imperial: { Value: 11.5, Unit: 'mi/h', UnitType: 9 },
            },
          },
          UVIndex: 0,
          UVIndexText: 'Low',
          Visibility: {
            Metric: { Value: 16.1, Unit: 'km', UnitType: 6 },
            Imperial: { Value: 10, Unit: 'mi', UnitType: 2 },
          },
          ObstructionsToVisibility: '',
          CloudCover: 95,
          Ceiling: {
            Metric: { Value: 457, Unit: 'm', UnitType: 5 },
            Imperial: { Value: 1500, Unit: 'ft', UnitType: 0 },
          },
          Pressure: {
            Metric: { Value: 1013.2, Unit: 'mb', UnitType: 14 },
            Imperial: { Value: 29.92, Unit: 'inHg', UnitType: 12 },
          },
          PressureTendency: { LocalizedText: 'Steady', Code: 'S' },
          Past24HourTemperatureDeparture: {
            Metric: { Value: 1.1, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 2, Unit: 'F', UnitType: 18 },
          },
          ApparentTemperature: {
            Metric: { Value: 13.9, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 57, Unit: 'F', UnitType: 18 },
          },
          WindChillTemperature: {
            Metric: { Value: 11.1, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 52, Unit: 'F', UnitType: 18 },
          },
          WetBulbTemperature: {
            Metric: { Value: 9.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 49, Unit: 'F', UnitType: 18 },
          },
          Precip1hr: {
            Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
            Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
          },
          PrecipitationSummary: {
            Precipitation: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            PastHour: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past3Hours: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past6Hours: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past9Hours: {
              Metric: { Value: 3, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.12, Unit: 'in', UnitType: 1 },
            },
            Past12Hours: {
              Metric: { Value: 7.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.28, Unit: 'in', UnitType: 1 },
            },
            Past18Hours: {
              Metric: { Value: 11.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.44, Unit: 'in', UnitType: 1 },
            },
            Past24Hours: {
              Metric: { Value: 11.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.44, Unit: 'in', UnitType: 1 },
            },
          },
          TemperatureSummary: {
            Past6HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 12.2, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 54, Unit: 'F', UnitType: 18 },
              },
            },
            Past12HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 16.1, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 61, Unit: 'F', UnitType: 18 },
              },
            },
            Past24HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 22.8, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 73, Unit: 'F', UnitType: 18 },
              },
            },
          },
          MobileLink:
            'http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us',
          Link: 'http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us',
        },
      ],
      [
        'Content-Type',
        'application/json; charset=utf-8',
        'Server',
        'Microsoft-IIS/10.0',
        'RateLimit-Limit',
        '200',
        'RateLimit-Remaining',
        '199',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET',
        'Access-Control-Allow-Headers',
        'Accept,Origin,Content-Type',
        'Access-Control-Max-Age',
        '1209600',
        'Cache-Control',
        'public, max-age=583',
        'Expires',
        'Fri, 22 Oct 2021 12:45:10 GMT',
        'Date',
        'Fri, 22 Oct 2021 12:35:27 GMT',
        'Content-Length',
        '4035',
        'Connection',
        'close',
      ],
    )

export const mockAWCurrentConditionsResponseSuccess = (): nock.Scope =>
  nock('http://apidev.accuweather.com:80', { encodedQueryParams: true })
    .get('/currentconditions/v1/2097720.json')
    .query({ details: 'true', apikey: 'test_api_key' })
    .reply(
      200,
      [
        {
          LocalObservationDateTime: '2021-10-22T08:28:00-04:00',
          EpochTime: 1634905680,
          WeatherText: 'Cloudy',
          WeatherIcon: 7,
          HasPrecipitation: false,
          PrecipitationType: null,
          IsDayTime: true,
          Temperature: {
            Metric: { Value: 10.9, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 52, Unit: 'F', UnitType: 18 },
          },
          RealFeelTemperature: {
            Metric: { Value: 7.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 46, Unit: 'F', UnitType: 18 },
          },
          RealFeelTemperatureShade: {
            Metric: { Value: 7.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 46, Unit: 'F', UnitType: 18 },
          },
          RelativeHumidity: 84,
          IndoorRelativeHumidity: 47,
          DewPoint: {
            Metric: { Value: 8.4, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 47, Unit: 'F', UnitType: 18 },
          },
          Wind: {
            Direction: { Degrees: 270, Localized: 'W', English: 'W' },
            Speed: {
              Metric: { Value: 18.5, Unit: 'km/h', UnitType: 7 },
              Imperial: { Value: 11.5, Unit: 'mi/h', UnitType: 9 },
            },
          },
          WindGust: {
            Speed: {
              Metric: { Value: 18.5, Unit: 'km/h', UnitType: 7 },
              Imperial: { Value: 11.5, Unit: 'mi/h', UnitType: 9 },
            },
          },
          UVIndex: 0,
          UVIndexText: 'Low',
          Visibility: {
            Metric: { Value: 16.1, Unit: 'km', UnitType: 6 },
            Imperial: { Value: 10, Unit: 'mi', UnitType: 2 },
          },
          ObstructionsToVisibility: '',
          CloudCover: 95,
          Ceiling: {
            Metric: { Value: 457, Unit: 'm', UnitType: 5 },
            Imperial: { Value: 1500, Unit: 'ft', UnitType: 0 },
          },
          Pressure: {
            Metric: { Value: 1013.2, Unit: 'mb', UnitType: 14 },
            Imperial: { Value: 29.92, Unit: 'inHg', UnitType: 12 },
          },
          PressureTendency: { LocalizedText: 'Steady', Code: 'S' },
          Past24HourTemperatureDeparture: {
            Metric: { Value: 1.1, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 2, Unit: 'F', UnitType: 18 },
          },
          ApparentTemperature: {
            Metric: { Value: 13.9, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 57, Unit: 'F', UnitType: 18 },
          },
          WindChillTemperature: {
            Metric: { Value: 11.1, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 52, Unit: 'F', UnitType: 18 },
          },
          WetBulbTemperature: {
            Metric: { Value: 9.7, Unit: 'C', UnitType: 17 },
            Imperial: { Value: 49, Unit: 'F', UnitType: 18 },
          },
          Precip1hr: {
            Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
            Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
          },
          PrecipitationSummary: {
            Precipitation: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            PastHour: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past3Hours: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past6Hours: {
              Metric: { Value: 0, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0, Unit: 'in', UnitType: 1 },
            },
            Past9Hours: {
              Metric: { Value: 3, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.12, Unit: 'in', UnitType: 1 },
            },
            Past12Hours: {
              Metric: { Value: 7.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.28, Unit: 'in', UnitType: 1 },
            },
            Past18Hours: {
              Metric: { Value: 11.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.44, Unit: 'in', UnitType: 1 },
            },
            Past24Hours: {
              Metric: { Value: 11.2, Unit: 'mm', UnitType: 3 },
              Imperial: { Value: 0.44, Unit: 'in', UnitType: 1 },
            },
          },
          TemperatureSummary: {
            Past6HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 12.2, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 54, Unit: 'F', UnitType: 18 },
              },
            },
            Past12HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 16.1, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 61, Unit: 'F', UnitType: 18 },
              },
            },
            Past24HourRange: {
              Minimum: {
                Metric: { Value: 10, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 50, Unit: 'F', UnitType: 18 },
              },
              Maximum: {
                Metric: { Value: 22.8, Unit: 'C', UnitType: 17 },
                Imperial: { Value: 73, Unit: 'F', UnitType: 18 },
              },
            },
          },
          MobileLink:
            'http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us',
          Link: 'http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us',
        },
      ],
      [
        'Content-Type',
        'application/json; charset=utf-8',
        'Server',
        'Microsoft-IIS/10.0',
        'RateLimit-Limit',
        '200',
        'RateLimit-Remaining',
        '199',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET',
        'Access-Control-Allow-Headers',
        'Accept,Origin,Content-Type',
        'Access-Control-Max-Age',
        '1209600',
        'Cache-Control',
        'public, max-age=583',
        'Expires',
        'Fri, 22 Oct 2021 12:45:10 GMT',
        'Date',
        'Fri, 22 Oct 2021 12:35:27 GMT',
        'Content-Length',
        '4035',
        'Connection',
        'close',
      ],
    )
