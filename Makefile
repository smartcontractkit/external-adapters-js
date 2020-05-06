check?=tradinghours

docker-v2:
	docker build --build-arg adapter=$(adapter) -f v2.Dockerfile . -t $(adapter)-adapter
serverless-v2: v2-deps v2-build
	(cd $(adapter)/dist && zip -r adapter.zip .) 
	(cd $(adapter) && zip ./dist/adapter.zip package.json)
v2-clean: 
	rm -rf $(adapter)/dist
	rm -f adapter.zip
v2-deps: v2-clean
	yarn --frozen-lockfile --production
v2-build:
	yarn ncc build $(adapter) -o $(adapter)/dist

docker-price:
	docker build --no-cache --build-arg adapter=$(adapter) -f Dockerfile . -t $(adapter)-adapter

docker-market-closure:
	docker build --no-cache --build-arg adapter=$(adapter) --build-arg check=$(check) -f Dockerfile-MarketClosure . -t $(adapter)-$(check)-adapter

yarn-install:
	yarn

serverless-price: yarn-install
	touch adapter.zip
	rm adapter.zip
	zip -r adapter.zip node_modules index.js
	zip -g -j adapter.zip $(adapter)/adapter.js

serverless-market-closure: serverless-price
	printf "@ adapter.js\n@=priceAdapter.js\n" | zipnote -w adapter.zip
	zip -g -j adapter.zip eth/readReferenceContract.js market-closure/$(check)/marketCheck.js market-closure/adapter.js
