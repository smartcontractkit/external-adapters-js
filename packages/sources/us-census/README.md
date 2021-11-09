# Chainlink External Adapter for the US Census (Decennial and American Community Survey)

The US Census adapter fetches the latest census results published by the United States Census Bureau and transforms the variables into user-friendly responses.

Please be careful with the latitude/longitude and passed into this, since there is only validation done on existence of the lat/lng (they must be a valid value in the US).

### Environment Variables

| Required? |  Name   |                               Description                               | Options | Defaults to |
| :-------: | :-----: | :---------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | [US Census API key](https://api.census.gov/data/key_signup.html) to use |         |             |

---

### Input Parameters

| Required? |   Name    |                                              Description                                              |                                        Options                                         | Defaults to |
| :-------: | :-------: | :---------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------: |
|    ✅     | endpoint  |        The [Census Source/year](https://www.census.gov/data/developers/data-sets.html) to use         | dec_2010, acs5_2013, acs5_2014, acs5_2015, acs5_2016, acs5_2017, acs5_2018, acs5_2019  |             |
|    ✅     | variables |   An array of the [variables](https://api.census.gov/data/2010/dec/sf1/variables.html) to query for   |                                                                                        |             |
|    ✅     | longitude |                              The longitude of the location to query for                               |                                                                                        |             |
|    ✅     | latitude  |                              The longitude of the location to query for                               |                                                                                        |             |
|           | geography | The [geography](https://api.census.gov/data/2010/dec/sf1/geography.html) of the variable to query for | block_group, tract, zip_code_tabulation_area, combined_statistical_area, county, state |    state    |

---

## Endpoints

### Census Variables

The available variables _vary by endpoint_. They are documented on the US Census website, but can be confusing. We highly recommend playing around with the Census APIs to understand the available variables.

Since we currently only support ACS 5 Year and Decennial, the variables available for each API/year combination are:

#### ACS 5

https://www.census.gov/data/developers/data-sets/acs-5year.html

Example: https://api.census.gov/data/2019/acs/acs5/variables.html or https://api.census.gov/data/2018/acs/acs5/variables.html

#### Decennial

https://www.census.gov/data/developers/data-sets/decennial-census.html

Example: https://api.census.gov/data/2010/dec/sf1/variables.html

### ACS 5 Year Input

These endpoints use the American Community Survey 5 Year results, which are the most accurate of the ACS results. They provide results down to the [block group](https://www2.census.gov/geo/pdfs/reference/geodiagram.pdf), which is a geography defined by the US Census. Block groups can provide census data down to the neighborhood level (on average, areas of [600 to 3,000 people](https://en.wikipedia.org/wiki/Census_block_group)).

### Decennial Input

These endpoints use the Decennial Census results, which is the most famous census and has the smallest geographies available. They provide results down to the [block](https://www2.census.gov/geo/pdfs/reference/geodiagram.pdf), which is another geography defined by the US Census, smaller. We do not (yet) support blocks, due to the confusion that can arise from inputting Decennial vs ACS 5 Year geographies.

_The 2020 Decennial results will be released at the end of 2021. This endpoint will be added once it is released by the US Census._

### Geographies

The subsequent geographies provide larger areas of statistics, up to the state level. A ZIP Code Tabulation Area is similar to a ZIP Code, but there is _no guaranteed 1-to-1 match_. ZIP Codes are considered a bad geography to rely on in Census data, and other census-driven geographies should be considered (such as block groups and tracts).

Please read the City SDK [here](https://github.com/uscensusbureau/citysdk) for more details.

### Sample Input

This is a request to get the Total Housing Units and Occupancy Status in the surrounding [CSA](https://en.wikipedia.org/wiki/Combined_statistical_area) in 2019. This, for example, could be used to calculate the occupancy ratio of houses in the surrounding geography.

```json
{
  "id": 1,
  "data": {
    "endpoint": "acs5_2019",
    "variables": ["B25001_001E", "B25002_002E"],
    "geography": "tract",
    "latitude": 37.774929,
    "longitude": -122.419418
  }
}
```

### Sample Output

The output is encoded as an array formatted as [fipsName,...requestedVariables] packed in bytes32 format. FIPS name is the name of the geography around the requested point.

```json
{
  "jobRunID": "1",
  "data": {
    "result": "0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000030c000000000000000000000000000000000000000000000000000000000000028e000000000000000000000000000000000000000000000000000000000000011f000000000000000000000000000000000000000000000000000000000000016f0000000000000000000000000000000000000000000000000000000000000041426c6f636b2047726f757020312c2043656e737573205472616374203230312c2053616e204672616e636973636f20436f756e74792c2043616c69666f726e696100000000000000000000000000000000000000000000000000000000000000"
  },
  "result": "0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000030c000000000000000000000000000000000000000000000000000000000000028e000000000000000000000000000000000000000000000000000000000000011f000000000000000000000000000000000000000000000000000000000000016f0000000000000000000000000000000000000000000000000000000000000041426c6f636b2047726f757020312c2043656e737573205472616374203230312c2053616e204672616e636973636f20436f756e74792c2043616c69666f726e696100000000000000000000000000000000000000000000000000000000000000",
  "statusCode": 200
}
```
