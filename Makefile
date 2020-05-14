check?=tradinghours

docker:
	docker build --build-arg adapter=$(adapter) -f Dockerfile . -t $(adapter)-adapter

zip: deps build
	(cd $(adapter)/dist && zip -r $(adapter)-adapter.zip .)

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
	yarn ncc build market-closure/$(check) -o market-closure/$(check)/dist
	rm market-closure/$(check)/priceAdapter.js
	rm market-closure/$(check)/adapter.js

docker-market-closure:
	docker build --no-cache --build-arg adapter=$(adapter) --build-arg check=$(check) -f Dockerfile-MarketClosure . -t $(adapter)-$(check)-adapter

zip-market-closure: deps clean-market-closure build-market-closure
	(cd market-closure/$(check)/dist && zip -r $(adapter)-$(check)-adapter.zip .)
