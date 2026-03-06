// export async function generateFromHF(prompt: string): Promise<string | undefined> {
//   try {
//     const response = await fetch(
//       `https://router.huggingface.co/v1/models/${process.env.HF_MODEL}`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.HF_TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           inputs: [
//             {
//               role: "user",
//               content: prompt
//             }
//           ]
//         })
//       }
//     );

//     const text = await response.text();
//     console.log("HF RAW RESPONSE:", text);

//     let result;
//     try {
//       result = JSON.parse(text);
//     } catch {
//       return undefined;
//     }

//     if (Array.isArray(result)) {
//       return result[0]?.generated_text;
//     }

//     if (result?.generated_text) {
//       return result.generated_text;
//     }

//     return undefined;

//   } catch (err) {
//     console.error("HF API Error:", err);
//     return undefined;
//   }
// }

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