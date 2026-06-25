import { defineAgent } from "eve";
import { anthropic } from "@ai-sdk/anthropic";

export default defineAgent({
  model: anthropic("claude-haiku-4-5-20251001"),
  modelContextWindowTokens: 200000,
});
