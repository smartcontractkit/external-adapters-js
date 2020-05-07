check?=tradinghours

docker:
	docker build --build-arg adapter=$(adapter) -f v2.Dockerfile . -t $(adapter)-adapter

zip: deps build
	(cd $(adapter)/dist && zip -r $(adapter)-adapter.zip .)
	(cd $(adapter) && zip ./dist/$(adapter)-adapter.zip package.json)

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
	cp eth/readReferenceContract.js market-closure/$(check)
	yarn ncc build market-closure/$(check) -o market-closure/$(check)/dist
	rm market-closure/$(check)/priceAdapter.js
	rm market-closure/$(check)/adapter.js
	rm market-closure/$(check)/readReferenceContract.js

docker-market-closure:
	docker build --no-cache --build-arg adapter=$(adapter) --build-arg check=$(check) -f Dockerfile-MarketClosure . -t $(adapter)-$(check)-adapter

zip-market-closure: deps clean-market-closure build-market-closure
	(cd market-closure/$(check)/dist && zip -r $(adapter)-$(check)-adapter.zip .)
	(cd market-closure/$(check) && zip ./dist/$(adapter)-$(check)-adapter.zip package.json)
