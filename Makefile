check?=tradinghours

docker:
	docker build --build-arg adapter=$(adapter) -f Dockerfile . -t $(adapter)-adapter

zip: deps build
	(cd $(adapter)/dist && zip  $(adapter)-adapter.zip index.js)

new:
	mkdir $(adapter)
	cp -r example/* $(adapter)
	sed -i 's/example/$(adapter)/' $(adapter)/package.json
	sed -i 's/Example/$(adapter)/' $(adapter)/README.md
	sed '/workspaces/ a \ \ \ \ "$(adapter)",' package.json > package.json.new
	mv package.json.new package.json

clean:
	rm -rf $(adapter)/dist

deps: clean
	yarn --frozen-lockfile --production

build:
	yarn ncc build $(adapter) -o $(adapter)/dist

clean-market-closure:
	rm -rf market-closure/$(check)/dist

build-market-closure:
	cp $(adapter)/adapter.js market-closure/$(check)/priceAdapter.js
	cp market-closure/adapter.js market-closure/$(check)
	cp -r helpers market-closure/helpers
	yarn ncc build market-closure/$(check) -o market-closure/$(check)/dist
	rm market-closure/$(check)/priceAdapter.js
	rm market-closure/$(check)/adapter.js

docker-market-closure:
	docker build --no-cache --build-arg adapter=$(adapter) --build-arg check=$(check) -f Dockerfile-MarketClosure . -t $(adapter)-$(check)-adapter

zip-market-closure: deps clean-market-closure build-market-closure
	(cd market-closure/$(check)/dist && zip $(adapter)-$(check)-adapter.zip index.js)

clean-synth-index:
	rm -rf synth-index/$(adapter)/dist

build-synth-index:
	cp synth-index/adapter.js synth-index/$(adapter)
	yarn ncc build synth-index/$(adapter) -o synth-index/$(adapter)/dist
	rm synth-index/$(adapter)/adapter.js

docker-synth-index:
	docker build --no-cache --build-arg adapter=$(adapter) -f Dockerfile-SynthIndex . -t synth-index-$(adapter)-adapter

zip-synth-index: deps clean-synth-index build-synth-index
	(cd synth-index/$(adapter)/dist && zip -r synth-index-$(adapter)-adapter.zip index.js)

clean-2-step:
	rm -rf 2-step/$(adapter)

build-2-step:
	cp -r $(adapter) 2-step/
	mv 2-step/$(adapter)/adapter.js 2-step/$(adapter)/priceAdapter.js
	cp 2-step/adapter.js 2-step/$(adapter)
	cp -r helpers 2-step/helpers
	yarn ncc build 2-step/$(adapter) -o 2-step/$(adapter)/dist
	rm 2-step/$(adapter)/priceAdapter.js
	rm 2-step/$(adapter)/adapter.js

docker-2-step:
	docker build --no-cache --build-arg adapter=$(adapter) -f Dockerfile-2Step . -t $(adapter)-2-step-adapter

zip-2-step: deps clean-2-step build-2-step
	(cd 2-step/$(adapter)/dist && zip $(adapter)-2-step-adapter.zip index.js)
