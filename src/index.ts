import * as p from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const _VERSION = '0.5.38';

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

  p.intro(chalk.bgCyan(chalk.black(' create-astreus-agent ')));

  const projectName = await p.text({
    message: 'What is your project name?',
    placeholder: 'my-astreus-agent',
    defaultValue: 'my-astreus-agent',
    validate: (value) => {
      if (!value) return 'Project name is required';
      if (!/^[a-z0-9-_]+$/i.test(value))
        return 'Project name can only contain letters, numbers, dashes and underscores';
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const features = await p.multiselect({
    message: 'Which features do you want to include?',
    options: [
      {
        value: 'memory',
        label: 'Memory',
        hint: 'Persistent agent memory with vector search',
      },
      {
        value: 'knowledge',
        label: 'Knowledge (RAG)',
        hint: 'Document ingestion and retrieval',
      },
      {
        value: 'graph',
        label: 'Graph Workflows',
        hint: 'DAG-based task orchestration',
      },
      {
        value: 'subagents',
        label: 'Sub-Agents',
        hint: 'Multi-agent coordination',
      },
      {
        value: 'plugins',
        label: 'Custom Plugins',
        hint: 'Extensible tool system',
      },
      {
        value: 'mcp',
        label: 'MCP Integration',
        hint: 'Model Context Protocol support',
      },
    ],
    required: false,
  });

  if (p.isCancel(features)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const provider = await p.select({
    message: 'Which LLM provider do you want to use?',
    options: [
      { value: 'openai', label: 'OpenAI', hint: 'GPT-4, GPT-3.5' },
      { value: 'anthropic', label: 'Anthropic', hint: 'Claude' },
      { value: 'google', label: 'Google', hint: 'Gemini' },
      { value: 'ollama', label: 'Ollama', hint: 'Local models' },
      { value: 'multiple', label: 'Multiple providers', hint: 'Configure later' },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const typescript = await p.confirm({
    message: 'Use TypeScript?',
    initialValue: true,
  });

  if (p.isCancel(typescript)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const config: ProjectConfig = {
    name: projectName as string,
    features: features as string[],
    provider: provider as string,
    typescript: typescript as boolean,
  };

  const spinner = p.spinner();
  spinner.start('Creating project...');

  try {
    await createProject(config);
    spinner.stop('Project created!');

    p.note(`cd ${config.name}\nnpm install\nnpm run dev`, 'Next steps');

    p.outro(chalk.green('Happy building! 🚀'));
  } catch (error) {
    spinner.stop('Failed to create project');
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: config.typescript ? 'tsx src/index.ts' : 'node src/index.js',
      build: config.typescript ? 'tsc' : undefined,
      start: config.typescript ? 'node dist/index.js' : 'node src/index.js',
    },
    dependencies: {
      '@astreus-ai/astreus': 'latest',
      dotenv: '^16.6.1',
    },
    devDependencies: config.typescript
      ? {
          '@types/node': '^20.19.25',
          tsx: '^4.19.0',
          typescript: '^5.8.3',
        }
      : undefined,
  };

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, {
    spaces: 2,
  });

  // Create tsconfig.json if TypeScript
  if (config.typescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        outDir: 'dist',
        rootDir: 'src',
        skipLibCheck: true,
      },
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist'],
    };

    await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, {
      spaces: 2,
    });
  }

  // Create .env.example (user should copy to .env and add their keys)
  const envContent = getEnvContent(config.provider);
  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);

  // Create .gitignore
  const gitignore = `node_modules/
dist/
.env
*.log
`;
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Create src directory and main file
  await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });

  const mainFile = generateMainFile(config);
  const ext = config.typescript ? 'ts' : 'js';
  await fs.writeFile(path.join(projectPath, `src/index.${ext}`), mainFile);

  // Create README
  const readme = generateReadme(config);
  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}

function getEnvContent(provider: string): string {
  const envVars: Record<string, string> = {
    openai: 'OPENAI_API_KEY=your-api-key-here',
    anthropic: 'ANTHROPIC_API_KEY=your-api-key-here',
    google: 'GEMINI_API_KEY=your-api-key-here',
    ollama: '# Ollama runs locally, no API key needed\nOLLAMA_HOST=http://localhost:11434',
    multiple: `# Add API keys for providers you want to use
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-key`,
  };

  return envVars[provider] || envVars.openai;
}

function generateMainFile(config: ProjectConfig): string {
  // Build imports based on selected features
  const sdkImports = ['Agent'];
  if (config.features.includes('memory')) {
    sdkImports.push('Memory');
  }
  if (config.features.includes('knowledge')) {
    sdkImports.push('Knowledge');
  }
  if (config.features.includes('graph')) {
    sdkImports.push('Graph');
  }
  if (config.features.includes('plugins')) {
    sdkImports.push('getPlugin');
  }

  const imports = [
    `import { ${sdkImports.join(', ')} } from '@astreus-ai/astreus';`,
    "import 'dotenv/config';",
  ];

  // Model mapping with updated model names
  const modelMap: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    google: 'gemini-2.0-flash',
    ollama: 'llama3',
    multiple: 'gpt-4o',
  };

  const model = modelMap[config.provider] || modelMap.openai;

  // Build agent config options
  const agentOptions: string[] = [
    `    name: '${config.name}'`,
    `    model: '${model}'`,
    "    systemPrompt: 'You are a helpful AI assistant powered by Astreus.'",
  ];

  if (config.features.includes('memory')) {
    agentOptions.push('    memory: true');
  }
  if (config.features.includes('knowledge')) {
    agentOptions.push('    knowledge: true');
  }

  // Build additional setup code for features
  let additionalSetup = '';

  if (config.features.includes('knowledge')) {
    additionalSetup += `
  // Add documents to knowledge base (optional)
  // const knowledge = new Knowledge({ agent });
  // await knowledge.addDocument('./documents/guide.pdf');
`;
  }

  if (config.features.includes('graph')) {
    additionalSetup += `
  // Create a graph workflow (optional)
  // const graph = new Graph({ name: 'my-workflow' }, agent);
  // graph.addAgentNode({ name: 'researcher', prompt: 'Research the topic' });
  // graph.addAgentNode({ name: 'writer', prompt: 'Write about the research' });
  // graph.link('researcher', 'writer');
  // const result = await graph.run('Tell me about AI agents');
`;
  }

  if (config.features.includes('plugins')) {
    additionalSetup += `
  // Register custom plugins (optional)
  // const myPlugin = getPlugin({
  //   name: 'my-plugin',
  //   tools: [{
  //     name: 'my_tool',
  //     description: 'My custom tool',
  //     parameters: { query: { type: 'string', description: 'The query' } },
  //     handler: async ({ query }) => ({ success: true, data: query })
  //   }]
  // });
  // agent.registerPlugin(myPlugin);
`;
  }

  if (config.features.includes('subagents')) {
    additionalSetup += `
  // Create sub-agents for complex tasks (optional)
  // const researcher = await Agent.create({ name: 'researcher', model: '${model}' });
  // const writer = await Agent.create({ name: 'writer', model: '${model}' });
  // agent.registerSubAgent(researcher);
  // agent.registerSubAgent(writer);
`;
  }

  return `${imports.join('\n')}

async function main() {
  console.log('Starting Astreus Agent...\\n');

  // Create the agent
  const agent = await Agent.create({
${agentOptions.join(',\n')},
  });
${additionalSetup}
  // Interactive loop
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Agent ready! Type your message (or "exit" to quit):\\n');

  const prompt = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('\\nGoodbye!');
        rl.close();
        process.exit(0);
      }

      try {
        const response = await agent.run(input);
        console.log(\`\\nAgent: \${response}\\n\`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
`;
}

function generateReadme(config: ProjectConfig): string {
  const featuresDoc =
    config.features.length > 0
      ? `\n## Features\n\nThis project includes:\n${config.features.map((f) => `- ${f}`).join('\n')}\n`
      : '';

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
