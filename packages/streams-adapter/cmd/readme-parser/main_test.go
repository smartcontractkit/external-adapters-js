package main

import (
	"strings"
	"testing"
)

func TestParseTableRow(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "simple row",
			input:    "| a | b | c |",
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "row with mixed content",
			input:    "|   ✅   |   base   |   `coin`, `from`   |",
			expected: []string{"✅", "base", "`coin`, `from`"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseTableRow(tt.input)
			if !stringSliceEqual(result, tt.expected) {
				t.Errorf("parseTableRow(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestParseEndpointInputRow(t *testing.T) {
	tests := []struct {
		name           string
		cols           []string
		epKey          string
		expectedParams map[string]ParamSpec
	}{
		{
			name:  "required param with aliases",
			cols:  []string{"✅", "base", "`coin`, `from`, `fsym`", "description"},
			epKey: "crypto",
			expectedParams: map[string]ParamSpec{
				"base": {
					Required: true,
					Aliases:  []string{"coin", "from", "fsym"},
				},
			},
		},
		{
			name:  "optional param",
			cols:  []string{"", "hours", "", "Number of hours"},
			epKey: "vwap",
			expectedParams: map[string]ParamSpec{
				"hours": {
					Required: false,
					Aliases:  nil,
				},
			},
		},
		{
			name:           "insufficient columns",
			cols:           []string{"✅", "base"},
			epKey:          "crypto",
			expectedParams: map[string]ParamSpec{},
		},
		{
			name:           "empty name",
			cols:           []string{"✅", "", "`alias`"},
			epKey:          "crypto",
			expectedParams: map[string]ParamSpec{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					tt.epKey: {
						Aliases: []string{},
						Params:  map[string]ParamSpec{},
					},
				},
			}

			parseEndpointInputRow(cfg, tt.epKey, tt.cols)

			ep := cfg.Endpoints[tt.epKey]
			if len(ep.Params) != len(tt.expectedParams) {
				t.Errorf("got %d params, want %d", len(ep.Params), len(tt.expectedParams))
				return
			}

			for name, expected := range tt.expectedParams {
				got, ok := ep.Params[name]
				if !ok {
					t.Errorf("param %q not found", name)
					continue
				}
				if got.Required != expected.Required {
					t.Errorf("param %q Required = %v, want %v", name, got.Required, expected.Required)
				}
				if !stringSliceEqual(got.Aliases, expected.Aliases) {
					t.Errorf("param %q Aliases = %v, want %v", name, got.Aliases, expected.Aliases)
				}
			}
		})
	}
}

func TestParseReadme(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected AdapterConfig
	}{
		{
			name: "single endpoint with multiple aliases",
			input: `# ADAPTER

## Crypto Endpoint

Supported names for this endpoint are: ` + "`crypto`, `price`" + `.

### Input Params

| Required? | Name | Aliases | Description |
| :---: | :---: | :---: | :---: |
| ✅ | base | ` + "`coin`, `from`" + ` | The base |
| ✅ | quote | ` + "`to`" + ` | The quote |
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					"crypto": {
						Aliases: []string{"crypto", "price"},
						Params: map[string]ParamSpec{
							"base": {
								Required: true,
								Aliases:  []string{"coin", "from"},
							},
							"quote": {
								Required: true,
								Aliases:  []string{"to"},
							},
						},
					},
				},
			},
		},
		{
			name: "single supported name",
			input: `# ADAPTER

## Volume Endpoint

` + "`volume`" + ` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases | Description |
| :---: | :---: | :---: | :---: |
| ✅ | base | ` + "`coin`" + ` | The base |
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					"volume": {
						Aliases: []string{"volume"},
						Params: map[string]ParamSpec{
							"base": {
								Required: true,
								Aliases:  []string{"coin"},
							},
						},
					},
				},
			},
		},
		{
			name: "multiple endpoints",
			input: `# ADAPTER

## Crypto Endpoint

Supported names for this endpoint are: ` + "`crypto`" + `.

### Input Params

| Required? | Name | Aliases | Description |
| :---: | :---: | :---: | :---: |
| ✅ | base | | The base |

## Vwap Endpoint

Supported names for this endpoint are: ` + "`vwap`, `crypto-vwap`" + `.

### Input Params

| Required? | Name | Aliases | Description |
| :---: | :---: | :---: | :---: |
| | hours | | Hours |
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					"crypto": {
						Aliases: []string{"crypto"},
						Params: map[string]ParamSpec{
							"base": {
								Required: true,
								Aliases:  nil,
							},
						},
					},
					"vwap": {
						Aliases: []string{"vwap", "crypto-vwap"},
						Params: map[string]ParamSpec{
							"hours": {
								Required: false,
								Aliases:  nil,
							},
						},
					},
				},
			},
		},
		{
			name: "endpoint without input params section",
			input: `# ADAPTER

## Simple Endpoint

Supported names for this endpoint are: ` + "`simple`" + `.

## Other Section

Some other content.
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					"simple": {
						Aliases: []string{"simple"},
						Params:  map[string]ParamSpec{},
					},
				},
			},
		},
		{
			name:  "empty readme",
			input: "",
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{},
			},
		},
		{
			name: "readme without endpoints",
			input: `# ADAPTER

## Environment Variables

| Name | Description |
| :---: | :---: |
| API_KEY | The API key |
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{},
			},
		},
		{
			name: "params with optional and required mixed",
			input: `# ADAPTER

## Data Endpoint

Supported names for this endpoint are: ` + "`data`" + `.

### Input Params

| Required? | Name | Aliases | Description |
| :---: | :---: | :---: | :---: |
| ✅ | symbol | ` + "`sym`" + ` | Symbol |
| | limit | ` + "`count`" + ` | Limit |
| ✅ | exchange | | Exchange |
`,
			expected: AdapterConfig{
				Endpoints: map[string]EndpointConfig{
					"data": {
						Aliases: []string{"data"},
						Params: map[string]ParamSpec{
							"symbol": {
								Required: true,
								Aliases:  []string{"sym"},
							},
							"limit": {
								Required: false,
								Aliases:  []string{"count"},
							},
							"exchange": {
								Required: true,
								Aliases:  nil,
							},
						},
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reader := strings.NewReader(tt.input)
			result, err := parseReadme(reader)
			if err != nil {
				t.Fatalf("parseReadme() error = %v", err)
			}

			// Compare endpoints count
			if len(result.Endpoints) != len(tt.expected.Endpoints) {
				t.Errorf("got %d endpoints, want %d", len(result.Endpoints), len(tt.expected.Endpoints))
				t.Errorf("got endpoints: %+v", result.Endpoints)
				return
			}

			for epName, expectedEp := range tt.expected.Endpoints {
				gotEp, ok := result.Endpoints[epName]
				if !ok {
					t.Errorf("endpoint %q not found", epName)
					continue
				}

				// Compare aliases
				if !stringSliceEqual(gotEp.Aliases, expectedEp.Aliases) {
					t.Errorf("endpoint %q Aliases = %v, want %v", epName, gotEp.Aliases, expectedEp.Aliases)
				}

				// Compare params count
				if len(gotEp.Params) != len(expectedEp.Params) {
					t.Errorf("endpoint %q got %d params, want %d", epName, len(gotEp.Params), len(expectedEp.Params))
					t.Errorf("got params: %+v", gotEp.Params)
					continue
				}

				for paramName, expectedParam := range expectedEp.Params {
					gotParam, ok := gotEp.Params[paramName]
					if !ok {
						t.Errorf("endpoint %q param %q not found", epName, paramName)
						continue
					}
					if gotParam.Required != expectedParam.Required {
						t.Errorf("endpoint %q param %q Required = %v, want %v",
							epName, paramName, gotParam.Required, expectedParam.Required)
					}
					if !stringSliceEqual(gotParam.Aliases, expectedParam.Aliases) {
						t.Errorf("endpoint %q param %q Aliases = %v, want %v",
							epName, paramName, gotParam.Aliases, expectedParam.Aliases)
					}
				}
			}
		})
	}
}

func TestParseReadme_RealWorldFormat(t *testing.T) {
	// Test with a realistic README format based on the NCFX adapter README
	input := `# NCFX

![4.5.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ncfx/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |             Name              |                        Description                        |  Type  | Options |                             Default                              |
| :-------: | :---------------------------: | :-------------------------------------------------------: | :----: | :-----: | :--------------------------------------------------------------: |
|           |         API_USERNAME          |             Username for the NCFX Crypto API              | string |         |                                                                  |
|           |         API_PASSWORD          |             Password for the NCFX Crypto API              | string |         |                                                                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                   Options                                                                                                                                                                   | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#crypto-lwba-endpoint), [crypto](#crypto-endpoint), [forex](#forex-endpoint), [price](#crypto-endpoint) | ` + "`crypto`" + ` |

## Crypto Endpoint

Supported names for this endpoint are: ` + "`crypto`, `price`" + `.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | ` + "`coin`, `from`" + ` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | ` + "`market`, `to`" + ` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

` + "```" + `json
{
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "USD"
  }
}
` + "```" + `

---

## Forex Endpoint

` + "`forex`" + ` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | ` + "`coin`, `from`" + ` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | ` + "`market`, `to`" + ` |    The symbol of the currency to convert to    | string |         |         |            |                |

---

MIT License
`

	reader := strings.NewReader(input)
	result, err := parseReadme(reader)
	if err != nil {
		t.Fatalf("parseReadme() error = %v", err)
	}

	// Verify crypto endpoint
	if crypto, ok := result.Endpoints["crypto"]; !ok {
		t.Error("crypto endpoint not found")
	} else {
		expectedAliases := []string{"crypto", "price"}
		if !stringSliceEqual(crypto.Aliases, expectedAliases) {
			t.Errorf("crypto Aliases = %v, want %v", crypto.Aliases, expectedAliases)
		}

		if base, ok := crypto.Params["base"]; !ok {
			t.Error("base param not found in crypto endpoint")
		} else {
			if !base.Required {
				t.Error("base param should be required")
			}
			expectedBaseAliases := []string{"coin", "from"}
			if !stringSliceEqual(base.Aliases, expectedBaseAliases) {
				t.Errorf("base Aliases = %v, want %v", base.Aliases, expectedBaseAliases)
			}
		}

		if quote, ok := crypto.Params["quote"]; !ok {
			t.Error("quote param not found in crypto endpoint")
		} else {
			if !quote.Required {
				t.Error("quote param should be required")
			}
			expectedQuoteAliases := []string{"market", "to"}
			if !stringSliceEqual(quote.Aliases, expectedQuoteAliases) {
				t.Errorf("quote Aliases = %v, want %v", quote.Aliases, expectedQuoteAliases)
			}
		}
	}

	// Verify forex endpoint
	if forex, ok := result.Endpoints["forex"]; !ok {
		t.Error("forex endpoint not found")
	} else {
		expectedAliases := []string{"forex"}
		if !stringSliceEqual(forex.Aliases, expectedAliases) {
			t.Errorf("forex Aliases = %v, want %v", forex.Aliases, expectedAliases)
		}
	}
}

// Helper function to compare string slices
func stringSliceEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
