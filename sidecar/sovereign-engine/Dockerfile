FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o sovereign-engine main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/sovereign-engine .
COPY --from=builder /app/proto ./proto

EXPOSE 50051
CMD ["./sovereign-engine"]
