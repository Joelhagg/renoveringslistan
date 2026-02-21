export function getClientId(): string {
    if (globalThis.window === undefined) return "";
    const key = "renoveringslistan_client_id";
    let clientId = localStorage.getItem(key);
    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem(key, clientId);
    }
    return clientId;
}