const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function CustomerDebugPage() {
  let result: unknown;

  try {
    const res = await fetch(
      `${API_URL}/api/quithero-customers?search=seanrosario119@gmail.com`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      result = { error: "Could not load customer data.", status: res.status, statusText: res.statusText };
    } else {
      result = await res.json();
    }
  } catch (error) {
    result = { error: error instanceof Error ? error.message : "Unknown error" };
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Customer debug</h1>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}
