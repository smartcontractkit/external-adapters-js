check?=tradinghours

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
