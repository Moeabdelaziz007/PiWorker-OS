PROTO_DIR=sidecar/sovereign-engine/proto

gen:
	protoc --go_out=. --go-grpc_out=. $(PROTO_DIR)/*.proto

node-ci:
	npm run typecheck
	npm run build

prebuild: gen tidy verify

tidy:
	go mod tidy

verify:
	go mod verify
	go vet ./...

build: prebuild
	go build -ldflags "-s -w" ./...

go-ci: verify
	go test ./...
	npm run build:cli
	chmod +x scripts/build-sovereign-engine.sh
	./scripts/build-sovereign-engine.sh

ci: node-ci go-ci

test:
	go test ./...
