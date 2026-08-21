package includes

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewIndex_Lookup(t *testing.T) {
	idx := NewIndex(AdapterIncludes{
		"XAU": {"USD": {Inverse: false}},
		"TRY": {"USD": {Inverse: true}},
		"USD": {"TRY": {Inverse: false}},
	})

	cases := []struct {
		from    string
		to      string
		inverse bool
		found   bool
	}{
		{"XAU", "USD", false, true},
		{"xau", "usd", false, true}, // case insensitive
		{"TRY", "USD", true, true},
		{"USD", "TRY", false, true},
		{"EUR", "USD", false, false},
	}

	for _, c := range cases {
		d, ok := idx.Lookup(c.from, c.to)
		require.Equal(t, c.found, ok, "lookup %s/%s", c.from, c.to)
		if c.found {
			require.Equal(t, c.inverse, d.Inverse, "inverse for %s/%s", c.from, c.to)
		}
	}
}

func TestLoad(t *testing.T) {
	idx, err := Load(filepath.Join("testdata", "adapter_includes.json"), "test")
	require.NoError(t, err)

	xau, ok := idx.Lookup("XAU", "USD")
	require.True(t, ok, "XAU/USD must exist")
	require.False(t, xau.Inverse)

	try, ok := idx.Lookup("TRY", "USD")
	require.True(t, ok, "TRY/USD must exist")
	require.True(t, try.Inverse)

	_, ok = idx.Lookup("EUR", "USD")
	require.False(t, ok, "EUR/USD must not exist")
}

func TestLoad_AdapterNotFound(t *testing.T) {
	_, err := Load(filepath.Join("testdata", "adapter_includes.json"), "missing")
	require.Error(t, err)
}

func TestLoad_FileNotFound(t *testing.T) {
	_, err := Load("does_not_exist.json", "test")
	require.Error(t, err)
}
