

export async function generateFromHF(prompt: string): Promise<string | undefined> {
  try {
    // 👇 Yaha apna ngrok public URL daalo
    const response = await fetch("https://hyperopic-flustrated-jane.ngrok-free.dev/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      console.error("HF Local Server Error:", response.status);
      return undefined;
    }

    const result = await response.json();

    if (result?.text) {
      return result.text;
    }

    console.error("Unexpected HF response:", result);
    return undefined;

  } catch (err) {
    console.error("HF Local API Error:", err);
    return undefined;
  }
}
