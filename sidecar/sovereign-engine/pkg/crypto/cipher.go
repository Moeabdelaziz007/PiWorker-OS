package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/base64"
	"fmt"
	"io"
)

/**
 * AMRIKYY LAB :: SOVEREIGN CIPHER (AES-256-GCM)
 * PURPOSE: Application-layer encryption to bypass transport-layer limitations (mTLS) on Vercel.
 */

const (
	saltSize   = 16
	keySize    = 32 // AES-256
	iterations = 100000
)

// deriveKey implements PBKDF2-HMAC-SHA256 manually to avoid dependency issues.
func deriveKey(password string, salt []byte) []byte {
	return pbkdf2([]byte(password), salt, iterations, keySize)
}

func pbkdf2(password, salt []byte, iter, keyLen int) []byte {
	prf := hmac.New(sha256.New, password)
	hashLen := prf.Size()
	numBlocks := (keyLen + hashLen - 1) / hashLen

	var result []byte
	for i := 1; i <= numBlocks; i++ {
		// T_i = U_1 ^ U_2 ^ ... ^ U_iter
		// U_1 = PRF(password, salt || INT_32_BE(i))
		prf.Reset()
		prf.Write(salt)
		binary.Write(prf, binary.BigEndian, uint32(i))
		U := prf.Sum(nil)

		T := make([]byte, len(U))
		copy(T, U)

		for j := 2; j <= iter; j++ {
			prf.Reset()
			prf.Write(U)
			U = prf.Sum(nil)
			for k := range T {
				T[k] ^= U[k]
			}
		}
		result = append(result, T...)
	}
	return result[:keyLen]
}

// Encrypt wraps the plaintext with AES-256-GCM using the provided secret.
func Encrypt(plaintext []byte, secret string) (string, error) {
	salt := make([]byte, saltSize)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return "", err
	}

	key := deriveKey(secret, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Result will be: salt + nonce + encrypted data
	ciphertext := gcm.Seal(nil, nonce, plaintext, nil)

	result := make([]byte, 0, len(salt)+len(nonce)+len(ciphertext))
	result = append(result, salt...)
	result = append(result, nonce...)
	result = append(result, ciphertext...)

	return base64.StdEncoding.EncodeToString(result), nil
}

// Decrypt unwraps the ciphertext with AES-256-GCM.
func Decrypt(cryptoText string, secret string) ([]byte, error) {
	data, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return nil, err
	}

	if len(data) < saltSize {
		return nil, fmt.Errorf("ciphertext too short (no salt)")
	}

	salt := data[:saltSize]
	remaining := data[saltSize:]

	key := deriveKey(secret, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(remaining) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short (no nonce)")
	}

	nonce, ciphertext := remaining[:nonceSize], remaining[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}
