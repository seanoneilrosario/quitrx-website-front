const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function CustomerDebugPage() {
  try {
    const res = await fetch(
      `${API_URL}/api/quithero-customers?search=seanrosario119@gmail.com`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return (
        <main style={{ padding: 32 }}>
          <h1>Customer debug</h1>
          <p>Could not load customer data.</p>
          <pre>{JSON.stringify({ status: res.status, statusText: res.statusText }, null, 2)}</pre>
        </main>
      );
    }

    const data = await res.json();

    return (
      <main style={{ padding: 32 }}>
        <h1>Customer debug</h1>
        <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </main>
    );
  } catch (error) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Customer debug</h1>
        <pre>{JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }, null, 2)}</pre>
      </main>
    );
  }
}
