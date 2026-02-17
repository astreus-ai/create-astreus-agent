import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

const VERSION = "0.5.37";

interface ProjectConfig {
  name: string;
  features: string[];
  provider: string;
  typescript: boolean;
}

async function main() {
  console.clear();
  console.log(
    chalk.cyan(`
  ██
 ████
██  ██
`)
  );

  p.intro(chalk.bgCyan(chalk.black(" create-astreus-agent ")));

  const projectName = await p.text({
    message: "What is your project name?",
    placeholder: "my-astreus-agent",
    defaultValue: "my-astreus-agent",
    validate: (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-z0-9-_]+$/i.test(value))
        return "Project name can only contain letters, numbers, dashes and underscores";
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const features = await p.multiselect({
    message: "Which features do you want to include?",
    options: [
      {
        value: "memory",
        label: "Memory",
        hint: "Persistent agent memory with vector search",
      },
      {
        value: "knowledge",
        label: "Knowledge (RAG)",
        hint: "Document ingestion and retrieval",
      },
      {
        value: "graph",
        label: "Graph Workflows",
        hint: "DAG-based task orchestration",
      },
      {
        value: "subagents",
        label: "Sub-Agents",
        hint: "Multi-agent coordination",
      },
      {
        value: "plugins",
        label: "Custom Plugins",
        hint: "Extensible tool system",
      },
      {
        value: "mcp",
        label: "MCP Integration",
        hint: "Model Context Protocol support",
      },
    ],
    required: false,
  });

  if (p.isCancel(features)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const provider = await p.select({
    message: "Which LLM provider do you want to use?",
    options: [
      { value: "openai", label: "OpenAI", hint: "GPT-4, GPT-3.5" },
      { value: "anthropic", label: "Anthropic", hint: "Claude" },
      { value: "google", label: "Google", hint: "Gemini" },
      { value: "ollama", label: "Ollama", hint: "Local models" },
      { value: "multiple", label: "Multiple providers", hint: "Configure later" },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const typescript = await p.confirm({
    message: "Use TypeScript?",
    initialValue: true,
  });

  if (p.isCancel(typescript)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const config: ProjectConfig = {
    name: projectName as string,
    features: features as string[],
    provider: provider as string,
    typescript: typescript as boolean,
  };

  const spinner = p.spinner();
  spinner.start("Creating project...");

  try {
    await createProject(config);
    spinner.stop("Project created!");

    p.note(
      `cd ${config.name}\nnpm install\nnpm run dev`,
      "Next steps"
    );

    p.outro(chalk.green("Happy building! 🚀"));
  } catch (error) {
    spinner.stop("Failed to create project");
    p.log.error(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}

async function createProject(config: ProjectConfig) {
  const projectPath = path.resolve(process.cwd(), config.name);

  // Check if directory exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory "${config.name}" already exists`);
  }

  // Create project directory
  await fs.mkdir(projectPath, { recursive: true });

  // Create package.json
  const packageJson = {
    name: config.name,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: config.typescript ? "tsx src/index.ts" : "node src/index.js",
      build: config.typescript ? "tsc" : undefined,
      start: config.typescript ? "node dist/index.js" : "node src/index.js",
    },
    dependencies: {
      "@astreus-ai/sdk": "latest",
      dotenv: "^16.6.1",
    },
    devDependencies: config.typescript
      ? {
          "@types/node": "^20.19.25",
          tsx: "^4.19.0",
          typescript: "^5.8.3",
        }
      : undefined,
  };

  await fs.writeJson(path.join(projectPath, "package.json"), packageJson, {
    spaces: 2,
  });

  // Create tsconfig.json if TypeScript
  if (config.typescript) {
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "node",
        esModuleInterop: true,
        strict: true,
        outDir: "dist",
        rootDir: "src",
        skipLibCheck: true,
      },
      include: ["src/**/*.ts"],
      exclude: ["node_modules", "dist"],
    };

    await fs.writeJson(path.join(projectPath, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });
  }

  // Create .env.example
  const envContent = getEnvContent(config.provider);
  await fs.writeFile(path.join(projectPath, ".env.example"), envContent);
  await fs.writeFile(path.join(projectPath, ".env"), envContent);

  // Create .gitignore
  const gitignore = `node_modules/
dist/
.env
*.log
`;
  await fs.writeFile(path.join(projectPath, ".gitignore"), gitignore);

  // Create src directory and main file
  await fs.mkdir(path.join(projectPath, "src"), { recursive: true });

  const mainFile = generateMainFile(config);
  const ext = config.typescript ? "ts" : "js";
  await fs.writeFile(path.join(projectPath, `src/index.${ext}`), mainFile);

  // Create README
  const readme = generateReadme(config);
  await fs.writeFile(path.join(projectPath, "README.md"), readme);
}

function getEnvContent(provider: string): string {
  const envVars: Record<string, string> = {
    openai: "OPENAI_API_KEY=your-api-key-here",
    anthropic: "ANTHROPIC_API_KEY=your-api-key-here",
    google: "GOOGLE_API_KEY=your-api-key-here",
    ollama: "# Ollama runs locally, no API key needed\nOLLAMA_HOST=http://localhost:11434",
    multiple: `# Add API keys for providers you want to use
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key`,
  };

  return envVars[provider] || envVars.openai;
}

function generateMainFile(config: ProjectConfig): string {
  const imports = ['import { Agent } from "@astreus-ai/sdk";', 'import "dotenv/config";'];

  if (config.features.includes("memory")) {
    imports.push('import { MemoryModule } from "@astreus-ai/sdk";');
  }
  if (config.features.includes("knowledge")) {
    imports.push('import { KnowledgeModule } from "@astreus-ai/sdk";');
  }
  if (config.features.includes("graph")) {
    imports.push('import { GraphModule } from "@astreus-ai/sdk";');
  }

  const providerMap: Record<string, { provider: string; model: string }> = {
    openai: { provider: "openai", model: "gpt-4" },
    anthropic: { provider: "anthropic", model: "claude-3-opus-20240229" },
    google: { provider: "google", model: "gemini-pro" },
    ollama: { provider: "ollama", model: "llama2" },
    multiple: { provider: "openai", model: "gpt-4" },
  };

  const { provider, model } = providerMap[config.provider] || providerMap.openai;

  let moduleSetup = "";
  if (config.features.includes("memory")) {
    moduleSetup += `
  // Memory module for persistent storage
  const memory = new MemoryModule({
    database: { type: "sqlite", path: "./data/memory.db" },
  });
`;
  }

  let agentModules = "";
  if (config.features.length > 0) {
    const modules = [];
    if (config.features.includes("memory")) modules.push("memory");
    if (modules.length > 0) {
      agentModules = `\n    modules: [${modules.join(", ")}],`;
    }
  }

  return `${imports.join("\n")}

async function main() {
  console.log("🚀 Starting Astreus Agent...\\n");
${moduleSetup}
  const agent = new Agent({
    name: "${config.name}",
    model: {
      provider: "${provider}",
      name: "${model}",
    },
    systemPrompt: "You are a helpful AI assistant powered by Astreus.",${agentModules}
  });

  // Run the agent
  const response = await agent.run({
    prompt: "Hello! What can you help me with today?",
  });

  console.log("Agent:", response.content);
}

main().catch(console.error);
`;
}

function generateReadme(config: ProjectConfig): string {
  const featuresDoc = config.features.length > 0
    ? `\n## Features\n\nThis project includes:\n${config.features.map((f) => `- ${f}`).join("\n")}\n`
    : "";

  return `# ${config.name}

An AI agent powered by [Astreus](https://astreus.org).

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API keys
   \`\`\`

3. Run the agent:
   \`\`\`bash
   npm run dev
   \`\`\`
${featuresDoc}
## Learn More

- [Astreus Documentation](https://astreus.org/docs)
- [Examples](https://github.com/astreus-ai/astreus/tree/main/examples)
`;
}

main().catch(console.error);
