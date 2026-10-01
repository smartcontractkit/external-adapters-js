package main

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestReadAdapterVersion(t *testing.T) {
	t.Run("returns version from response", func(t *testing.T) {
		resp := &http.Response{
			Body: io.NopCloser(strings.NewReader(`{"message":"OK","version":"2.14.1"}`)),
		}
		require.Equal(t, "2.14.1", readAdapterVersion(resp))
	})

	t.Run("returns empty for missing version", func(t *testing.T) {
		resp := &http.Response{
			Body: io.NopCloser(strings.NewReader(`{"message":"OK"}`)),
		}
		require.Empty(t, readAdapterVersion(resp))
	})

	t.Run("returns empty for invalid JSON", func(t *testing.T) {
		resp := &http.Response{
			Body: io.NopCloser(strings.NewReader(`not json`)),
		}
		require.Empty(t, readAdapterVersion(resp))
	})
}
