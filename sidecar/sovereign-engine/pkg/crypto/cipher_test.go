package crypto

import (
	"bytes"
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	secret := "my-super-secret-key"
	plaintext := []byte("hello world")

	encrypted, err := Encrypt(plaintext, secret)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	decrypted, err := Decrypt(encrypted, secret)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}

	if !bytes.Equal(plaintext, decrypted) {
		t.Errorf("expected %s, got %s", plaintext, decrypted)
	}
}

func TestDecryptWithWrongSecret(t *testing.T) {
	secret := "my-super-secret-key"
	wrongSecret := "wrong-secret"
	plaintext := []byte("hello world")

	encrypted, err := Encrypt(plaintext, secret)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	_, err = Decrypt(encrypted, wrongSecret)
	if err == nil {
		t.Errorf("expected error when decrypting with wrong secret, got nil")
	}
}
