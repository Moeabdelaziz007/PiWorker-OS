/**
 * AMRIKYY LAB :: SOVEREIGN FINANCE
 * Pi Network Authentication Kernel
 */
/**
 * Initiates the sovereign wallet authentication flow.
 * Scopes: payments, username
 */
export async function authenticateSovereignWallet() {
    return new Promise((resolve, reject) => {
        // Check if we are in a browser environment
        if (typeof globalThis.window === "undefined") {
            console.log("[PI-AUTH] Running in Server/Node mode. Bypassing SDK.");
            resolve({ uid: "SYSTEM_ROOT", username: "amrikyy_root", accessToken: "n/a" });
            return;
        }
        const win = globalThis.window;
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
            .catch((err) => {
            console.error("[PI_AUTH] Sovereign Failure:", err);
            reject(err);
        });
    });
}
/**
 * Handle incomplete payments to ensure financial integrity.
 */
function onIncompletePaymentFound(payment) {
    console.warn("[PI_FINANCE] Incomplete payment detected for tx:", payment.identifier);
    // Future implementation: Resolve via backend check.
}
