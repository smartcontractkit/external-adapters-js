check?=schedule

docker:
	docker build --build-arg adapter=$(adapter) --build-arg name=$(name) -f Dockerfile . -t $(repo)$(if $(name),$(name),$(adapter))-adapter $(if $(tag), -t $(repo)$(tag), )

new:
	mkdir $(adapter)
	cp -R example/* $(adapter)
	# cp -R will not copy hidden & special files, so we copy manualy
	cp example/.eslintrc.js $(adapter)
	cat package.json \
	  | jq '.workspaces += ["$(adapter)"]' \
	  | tee package.json > /dev/null
	cat .github/strategy/adapters.json \
	  | jq '.adapters.adapter += ["$(adapter)"]' \
	  | tee .github/strategy/adapters.json > /dev/null
	cat $(adapter)/package.json \
	  | jq '.name = "@chainlink/$(adapter)-adapter" | .description = "Chainlink $(adapter) adapter." | .keywords += ["$(adapter)"]' \
	  | tee $(adapter)/package.json > /dev/null
	sed -i 's/Example/$(adapter)/' $(adapter)/README.md

deps:
	##########################
	# Clean up previous builds
	##########################
	yarn workspace @chainlink/${name} clean
	######################
	# Install dependencies
	######################
	yarn install
	#######################################
	# Compile TypeScript code to JavaScript
	#######################################
	yarn workspace @chainlink/${name} setup
	yarn --frozen-lockfile --production

build:
	#######################################
	# Compile JavaScript to a single file
	#######################################
	npx @vercel/ncc@0.25.1 build packages/$(adapter) -o packages/$(adapter)/dist
