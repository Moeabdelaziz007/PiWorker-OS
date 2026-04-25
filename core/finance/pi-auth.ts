/**
 * AMRIKYY LAB :: SOVEREIGN FINANCE
 * Pi Network Authentication Kernel
 */

export interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
}

interface PiSDK {
  authenticate: (scopes: string[], onIncompletePaymentFound: (payment: unknown) => void) => Promise<{
    user: { uid: string; username: string };
    accessToken: string;
  }>;
}

/**
 * Initiates the sovereign wallet authentication flow.
 * Scopes: payments, username
 */
export async function authenticateSovereignWallet(): Promise<PiUser> {
  return new Promise((resolve, reject) => {
    // Check if we are in a browser environment
    if (typeof globalThis.window === "undefined") {
      console.log("[PI-AUTH] Running in Server/Node mode. Bypassing SDK.");
      resolve({ uid: "SYSTEM_ROOT", username: "amrikyy_root", accessToken: "n/a" });
      return;
    }

    const win = globalThis.window as unknown as { Pi: PiSDK };
    if (!win.Pi) {
      reject(new Error("Pi Network SDK not found in window context."));
      return;
    }

    const Pi = win.Pi;

    Pi.authenticate(['payments', 'username'], onIncompletePaymentFound)
      .then((auth) => {
        // AMRIKYY_SECURITY: We return the user data for in-memory processing.
        // DO NOT store the accessToken in plain text.
        resolve({
          uid: auth.user.uid,
          username: auth.user.username,
          accessToken: auth.accessToken
        });
      })
      .catch((err: unknown) => {
        console.error("[PI_AUTH] Sovereign Failure:", err);
        reject(err);
      });
  });
}

/**
 * Handle incomplete payments to ensure financial integrity.
 */
function onIncompletePaymentFound(payment: unknown) {
  const p = payment as { identifier: string };
  console.warn("[PI_FINANCE] Incomplete payment detected for tx:", p?.identifier);
  // Future implementation: Resolve via backend check.
}
