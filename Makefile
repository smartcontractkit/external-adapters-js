check?=schedule

docker:
	docker build --build-arg adapter=$(adapter) --build-arg name=$(name) -f Dockerfile . -t $(repo)$(if $(name),$(name),$(adapter))-adapter $(if $(tag), -t $(repo)$(tag), )

zip: deps build
	(cd $(adapter)/dist && zip $(if $(name),$(name),$(adapter))-adapter.zip index.js)

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

clean:
	rm -rf $(adapter)/dist

deps: clean
	# Restore all dependencies
	yarn
	# Call the build script for the adapter if defined (TypeScript adapters have this extra build/compile step)
	# We use `wsrun` to build workspace dependencies in topological order (TODO: use native `yarn workspaces foreach -pt run setup` with Yarn 2)
	yarn wsrun -mre -p @chainlink/ea-bootstrap -t setup
	yarn wsrun -mre -p @chainlink/ea-factories -t setup
	yarn wsrun -mre -p @chainlink/external-adapter -t setup
	yarn wsrun -mre -p @chainlink/$(if $(name),$(name),$(adapter))-adapter -t setup
	yarn --frozen-lockfile --production

build:
	npx @vercel/ncc@0.25.1 build $(adapter) -o $(adapter)/dist

clean-2-step:
	rm -rf 2-step/$(adapter)

build-2-step:
	cp -r $(adapter) 2-step/
	if [ -f "2-step/$(adapter)/dist/adapter.js" ]; then \
		mv 2-step/$(adapter)/dist/adapter.js 2-step/$(adapter)/priceAdapter.js; \
	else mv 2-step/$(adapter)/adapter.js 2-step/$(adapter)/priceAdapter.js; \
	fi
	cp 2-step/adapter.js 2-step/$(adapter)
	cp -r helpers 2-step/helpers
	npx @vercel/ncc@0.25.1 build 2-step/$(adapter) -o 2-step/$(adapter)/dist
	rm 2-step/$(adapter)/priceAdapter.js
	rm 2-step/$(adapter)/adapter.js

docker-2-step:
	docker build --no-cache --build-arg adapter=$(adapter) -f Dockerfile-2Step . -t $(repo)$(adapter)-2-step-adapter

zip-2-step: deps clean-2-step build-2-step
	(cd 2-step/$(adapter)/dist && zip $(adapter)-2-step-adapter.zip index.js)
