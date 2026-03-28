import { translateText } from "./server/translation";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("Testing AI Translation...");
  console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
  console.log("OPENAI_API_BASE:", process.env.OPENAI_API_BASE);
  
  try {
    const result = await translateText("Will Bitcoin reach $100,000 by the end of 2024?", "zh-TW");
    console.log("Translation Result (zh-TW):", result);
  } catch (error) {
    console.error("Translation ERROR:", error);
  }
}

test();
