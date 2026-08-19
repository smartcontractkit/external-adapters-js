package helpers

import (
	"encoding/json"
	"fmt"
	"strconv"

	types "streams-adapter/common"
)

// InvertObservation returns a copy of obs with its numeric result(s) replaced
// by their reciprocal. Used for requests whose original pair is the inverse
// of the transformed key the provider actually publishes.
func InvertObservation(obs *types.Observation) (*types.Observation, error) {
	inverted := *obs

	data, err := invertResultInObject(obs.Data)
	if err != nil {
		return nil, err
	}
	inverted.Data = data

	if len(obs.Result) > 0 {
		result, err := invertRawNumber(obs.Result)
		if err != nil {
			return nil, err
		}
		inverted.Result = result
	}

	return &inverted, nil
}

func invertResultInObject(raw json.RawMessage) (json.RawMessage, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("unable to invert observation result: %w", err)
	}

	result, ok := data["result"]
	if !ok {
		return nil, fmt.Errorf("unable to invert observation result: missing result")
	}
	num, err := numberFromInterface(result)
	if err != nil {
		return nil, err
	}
	if num == 0 {
		return nil, fmt.Errorf("unable to invert observation result: result is zero")
	}

	data["result"] = 1 / num
	return json.Marshal(data)
}

func invertRawNumber(raw json.RawMessage) (json.RawMessage, error) {
	var num float64
	if err := json.Unmarshal(raw, &num); err != nil {
		return nil, fmt.Errorf("unable to invert top-level result: %w", err)
	}
	if num == 0 {
		return nil, fmt.Errorf("unable to invert top-level result: result is zero")
	}
	return json.Marshal(1 / num)
}

func numberFromInterface(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case json.Number:
		return v.Float64()
	case string:
		num, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return 0, fmt.Errorf("unable to invert observation result: result is not numeric")
		}
		return num, nil
	default:
		return 0, fmt.Errorf("unable to invert observation result: result is not numeric")
	}
}
