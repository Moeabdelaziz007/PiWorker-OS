#!/bin/bash

# PiWorker-OS Certificate Generator (mTLS)
# Developed by MAS-ZERO for Ring 5 Neural Vault Security.

set -e

CERT_DIR="./infra/certs"
mkdir -p "$CERT_DIR"

echo "🔐 Generating Root CA..."
openssl genrsa -out "$CERT_DIR/ca.key" 4096
openssl req -x509 -new -nodes -key "$CERT_DIR/ca.key" -sha256 -days 3650 -out "$CERT_DIR/ca.crt" -subj "/CN=PiWorker-Sovereign-CA"

echo "🖥️ Generating Server Certificate..."
openssl genrsa -out "$CERT_DIR/server.key" 2048
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" -subj "/CN=sovereign-engine"
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial -out "$CERT_DIR/server.crt" -days 365 -sha256

echo "🔑 Generating Client Certificate..."
openssl genrsa -out "$CERT_DIR/client.key" 2048
openssl req -new -key "$CERT_DIR/client.key" -out "$CERT_DIR/client.csr" -subj "/CN=orchestrator"
openssl x509 -req -in "$CERT_DIR/client.csr" -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial -out "$CERT_DIR/client.crt" -days 365 -sha256

# Cleanup CSRs
rm "$CERT_DIR"/*.csr "$CERT_DIR"/*.srl

echo "✅ Certificates generated in $CERT_DIR"
