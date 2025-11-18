# How To Use
1. Pull down this branch `ea-agent`
1. Create the EA Spec YAML following [EA Development Readiness by EA Specs Validator Rovo AI](https://smartcontract-it.atlassian.net/wiki/x/M4Bhew)
2. Copy the generated EA Spec YAML and paste it to the `ea-agent/ea-requirements/`
3. Replace the EA Framework repo path in the [ea_development_agent](../.cursor/rules/ea_development_agent.mdc) at line 26
4. Open a new cursor chat window
5. Set the agent mode to `Agent` and the AI model to `claude-4.5-sonnet`
6. type the following in the chat to scaffold the EA single source package
    ```bash
    @ea_development_agent.mdc @example-ea-spec.yaml 
    ```
7. Unit tests
    - a. open a new cursor chat window
    - b. type the following in the chat
        ```
        @ea_unit_test_writer.mdc @path-to-ea-source-package
        ```
    - c. once the unit tests are ready, validate the code quality with a new chat
        ```
        @ea_unit_test_validator.mdc @path-to-ea-source-package
        ```
    - d. iterate the unit tests quality by repeating steps 6.b and 6.c
8. Integration tests - Incoming
