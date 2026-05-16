// Simple browser-compatible SHA-256 hash simulator for demo purposes
// In a real blockchain scenario, this would use Web3.js or equivalent to sign and broadcast the transaction.

export async function generateBlockchainHash(payloadObject) {
    const dataString = JSON.stringify(payloadObject);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    
    // Web Crypto API
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `0x${hashHex}`;
    } catch {
        // Fallback if crypto isn't available
        return '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    }
}
