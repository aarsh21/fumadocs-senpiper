import { createOpencode } from "ai-sdk-provider-opencode-sdk";
import path from "path";

const OPENCODE_HOSTNAME = process.env.OPENCODE_HOSTNAME || "127.0.0.1";
const OPENCODE_PORT = process.env.OPENCODE_PORT
  ? parseInt(process.env.OPENCODE_PORT, 10)
  : 4096;
const OPENCODE_AGENT = process.env.OPENCODE_AGENT || "senpiper-docs";
const OPENCODE_DOCS_DIR =
  process.env.OPENCODE_DOCS_DIRECTORY ||
  path.join(process.cwd(), "content", "docs");

export const opencode = createOpencode({
  hostname: OPENCODE_HOSTNAME,
  port: OPENCODE_PORT,
  autoStartServer: false,
  defaultSettings: {
    agent: OPENCODE_AGENT,
    cwd: OPENCODE_DOCS_DIR,
    sessionTitle: "Documentation Assistant",
    tools: {
      Grep: true,
      Read: true,
      Glob: true,
      Bash: false,
      Write: false,
    },
  },
});

export const DEFAULT_MODEL_ID =
  process.env.OPENCODE_MODEL_ID || "opencode/minimax-m2.1-free";
