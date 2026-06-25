import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Fetches the client list from the ION Recruitment dashboard API",
  inputSchema: z.object({}),
  async execute() {
    const response = await fetch("https://rc-eight-mu.vercel.app/api/clients", {
      method: "GET",
      headers: {
        "Authorization": "Bearer 54321", // Using the PIN as the authorization token
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
});
