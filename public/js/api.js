const API_URL = "/comando";

export async function getCommand() {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Servidor respondeu HTTP ${response.status}`);
  return response.json();
}

export async function sendCommand(command) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Falha HTTP ${response.status}`);
  return data;
}
