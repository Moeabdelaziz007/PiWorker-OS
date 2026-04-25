PROTO_DIR=sidecar/sovereign-engine/proto

gen:
	protoc --go_out=. --go-grpc_out=. $(PROTO_DIR)/*.proto

prebuild: gen tidy verify

tidy:
	go mod tidy

verify:
	go mod verify
	go vet ./...

build: prebuild
	go build -ldflags "-s -w" ./...

ci: build test

test:
	go test ./...

tier1:
	npm run typecheck
	go vet ./...
	npm run lint

tier2:
	go test ./...
	npm run test:unit:node

tier3:
	npm run test:tier3

tier4:
	npm run test:tier4

tiers: tier1 tier2 tier3 tier4
