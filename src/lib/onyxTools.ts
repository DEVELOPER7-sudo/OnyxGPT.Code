/**
 * Onyx AI Tools Definition
 * Updated from Lovable agent tools with Onyx branding and improved error handling
 */

export const ONYX_TOOLS = [
  {
    name: "onyx-add-dependency",
    description: "Use this tool to add a dependency to the project. The dependency should be a valid npm package name.",
    parameters: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "Package name with optional version (e.g., 'lodash@latest')",
        },
      },
      required: ["package"],
    },
  },
  {
    name: "onyx-search-files",
    description: "Regex-based code search with file filtering and context. Search using regex patterns across files in your project.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Regex pattern to find (e.g., 'useState')",
        },
        include_pattern: {
          type: "string",
          description: "Files to include using glob syntax (e.g., 'src/**')",
        },
        exclude_pattern: {
          type: "string",
          description: "Files to exclude using glob syntax (e.g., '**/*.test.tsx')",
        },
        case_sensitive: {
          type: "boolean",
          description: "Whether to match case (default: false)",
        },
      },
      required: ["query", "include_pattern"],
    },
  },
  {
    name: "onyx-write",
    description: "Use this tool to write to a file. Overwrites the existing file if there is one. The file path should be relative to the project root.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "File path relative to project root (e.g., 'src/main.ts')",
        },
        content: {
          type: "string",
          description: "Complete file content to write",
        },
      },
      required: ["file_path", "content"],
    },
  },
  {
    name: "onyx-line-replace",
    description: "Line-Based Search and Replace Tool. Use this tool to find and replace specific content in a file using explicit line numbers.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path of the file to modify",
        },
        search: {
          type: "string",
          description: "Content to search for in the file (without line numbers)",
        },
        first_replaced_line: {
          type: "number",
          description: "First line number to replace (1-indexed)",
        },
        last_replaced_line: {
          type: "number",
          description: "Last line number to replace (1-indexed)",
        },
        replace: {
          type: "string",
          description: "New content to replace the search content with",
        },
      },
      required: ["file_path", "search", "first_replaced_line", "last_replaced_line", "replace"],
    },
  },
  {
    name: "onyx-download-to-repo",
    description: "Download a file from a URL and save it to the repository.",
    parameters: {
      type: "object",
      properties: {
        source_url: {
          type: "string",
          description: "The URL of the file to download",
        },
        target_path: {
          type: "string",
          description: "The path where the file should be saved in the repository",
        },
      },
      required: ["source_url", "target_path"],
    },
  },
  {
    name: "onyx-fetch-website",
    description: "Fetches a website and temporarily saves its content (markdown, HTML, screenshot) to files in 'tmp://fetched-websites/'.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the website to fetch",
        },
        formats: {
          type: "string",
          description: "Comma-separated list of formats to return (markdown, html, screenshot)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "onyx-copy",
    description: "Use this tool to copy a file or directory to a new location.",
    parameters: {
      type: "object",
      properties: {
        source_file_path: {
          type: "string",
          description: "Source file path",
        },
        destination_file_path: {
          type: "string",
          description: "Destination file path",
        },
      },
      required: ["source_file_path", "destination_file_path"],
    },
  },
  {
    name: "onyx-view",
    description: "Use this tool to read the contents of a file. If it's a project file, the file path should be relative to the project root.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "File path relative to project root",
        },
        lines: {
          type: "string",
          description: "Optional line ranges to read (e.g., '1-800, 1001-1500')",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "onyx-read-console-logs",
    description: "Use this tool to read the contents of the latest console logs. You can optionally provide a search query to filter the logs.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional search query to filter logs",
        },
      },
      required: ["search"],
    },
  },
  {
    name: "onyx-read-network-requests",
    description: "Use this tool to read the contents of the latest network requests. You can optionally provide a search query to filter the requests.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional search query to filter requests",
        },
      },
      required: ["search"],
    },
  },
  {
    name: "onyx-remove-dependency",
    description: "Use this tool to uninstall a package from the project.",
    parameters: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "Package name to remove",
        },
      },
      required: ["package"],
    },
  },
  {
    name: "onyx-rename",
    description: "Use this tool to rename a file instead of creating new files and deleting old ones.",
    parameters: {
      type: "object",
      properties: {
        original_file_path: {
          type: "string",
          description: "Original file path",
        },
        new_file_path: {
          type: "string",
          description: "New file path",
        },
      },
      required: ["original_file_path", "new_file_path"],
    },
  },
  {
    name: "onyx-delete",
    description: "Use this tool to delete a file. The file path should be relative to the project root.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "File path to delete",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "onyx-add-secret",
    description: "Add a new secret such as an API key or token. This tool ensures that the secret is encrypted and stored properly.",
    parameters: {
      type: "object",
      properties: {
        secret_name: {
          type: "string",
          description: "Name of the secret (e.g., 'STRIPE_API_KEY')",
        },
      },
      required: ["secret_name"],
    },
  },
  {
    name: "onyx-update-secret",
    description: "Update an existing secret such as an API key or token.",
    parameters: {
      type: "object",
      properties: {
        secret_name: {
          type: "string",
          description: "Name of the secret to update",
        },
      },
      required: ["secret_name"],
    },
  },
  {
    name: "onyx-docs-search",
    description: "Search official documentation via the Content API. Returns ranked results with title, slug, URL, and content snippet.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to search in documentation",
        },
        max_results: {
          type: "number",
          description: "Max number of results (default 5, capped at 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "onyx-docs-get",
    description: "Fetch a complete documentation page by slug via the Content API. Returns structured content including full markdown, headings outline, and metadata.",
    parameters: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Canonical document slug to fetch",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "onyx-parse-document",
    description: "Parse and extract content from documents (first 50 pages). Handles PDFs, Word docs, PowerPoint, Excel, MP3 and many other formats.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the document file to parse",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "onyx-generate-image",
    description: "Generates an image based on a text prompt and saves it to the specified file path.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the desired image",
        },
        target_path: {
          type: "string",
          description: "The file path where the generated image should be saved",
        },
        width: {
          type: "number",
          description: "Image width (minimum 512, maximum 1920)",
        },
        height: {
          type: "number",
          description: "Image height (minimum 512, maximum 1920)",
        },
        model: {
          type: "string",
          description: "The model to use for generation (flux.schnell, flux.dev)",
        },
      },
      required: ["prompt", "target_path"],
    },
  },
  {
    name: "onyx-edit-image",
    description: "Edits or merges existing images based on a text prompt.",
    parameters: {
      type: "object",
      properties: {
        image_paths: {
          type: "array",
          items: { type: "string" },
          description: "Array of paths to existing image files",
        },
        prompt: {
          type: "string",
          description: "Text description of how to edit/merge the image(s)",
        },
        target_path: {
          type: "string",
          description: "The file path where the edited/merged image should be saved",
        },
      },
      required: ["image_paths", "prompt", "target_path"],
    },
  },
  {
    name: "onyx-web-search",
    description: "Performs a web search and returns relevant results with text content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        numResults: {
          type: "number",
          description: "Number of search results to return (default: 5)",
        },
        category: {
          type: "string",
          description: "Category of search results to return",
        },
        links: {
          type: "number",
          description: "Number of links to return for each result",
        },
        imageLinks: {
          type: "number",
          description: "Number of image links to return for each result",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "onyx-read-project-analytics",
    description: "Read the analytics for the production build of the project between two dates, with a given granularity.",
    parameters: {
      type: "object",
      properties: {
        startdate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        enddate: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
        granularity: {
          type: "string",
          description: "Granularity of results (hourly or daily)",
        },
      },
      required: ["startdate", "enddate", "granularity"],
    },
  },
  {
    name: "onyx-enable-stripe",
    description: "Enable the Stripe integration on the current project.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "onyx-run-security-scan",
    description: "Perform comprehensive security analysis of the backend to detect exposed data, missing RLS policies, and security misconfigurations.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "onyx-get-security-scan-results",
    description: "Fetch security information about the project that the user has access to.",
    parameters: {
      type: "object",
      properties: {
        force: {
          type: "boolean",
          description: "Set force=true to get results even if a scan is running",
        },
      },
      required: ["force"],
    },
  },
  {
    name: "onyx-get-table-schema",
    description: "Get the database table schema information and security analysis prompt for the project's database.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

/**
 * Convert Onyx tool to system prompt format
 */
export function formatToolsForSystemPrompt(): string {
  const toolsJson = JSON.stringify(ONYX_TOOLS, null, 2);
  return `
## Available Tools

You have access to a set of tools to help you complete tasks. Use them by outputting a JSON code block with the tool call:

\`\`\`json
{
  "tool": "onyx_write_file",
  "args": {
    "path": "/src/App.tsx",
    "content": "..."
  }
}
\`\`\`

### Tool Definitions

${ONYX_TOOLS.map(tool => {
  const params = Object.entries(tool.parameters.properties)
    .map(([name, detail]: [string, any]) => {
      const required = tool.parameters.required?.includes(name) ? ' (required)' : ' (optional)';
      return `    - **${name}**${required}: ${detail.description}`;
    })
    .join('\n');

  return `#### ${tool.name}

${tool.description}

${params}`;
}).join('\n\n')}
`;
}

/**
 * Parse Onyx tool call from AI response
 */
export function parseOnyxToolCall(text: string): { name: string; args: Record<string, unknown> } | null {
  // Look for ```json tool blocks
  const toolMatch = text.match(/```json\s*\{[\s\S]*?"tool"\s*:\s*"onyx_[^"]+"[\s\S]*?\}\s*```/);
  if (toolMatch) {
    try {
      const jsonStr = toolMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
      const parsed = JSON.parse(jsonStr);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }

  // Look for ```tool-use blocks
  const toolUseMatch = text.match(/```tool-use\s*\n([\s\S]*?)\n```/);
  if (toolUseMatch) {
    try {
      const parsed = JSON.parse(toolUseMatch[1]);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }

  // Look for inline JSON
  const jsonMatch = text.match(/\{[\s\S]*?"tool"\s*:\s*"onyx_[^"]+"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check if text contains any Onyx tool call
 */
export function containsOnyxToolCall(text: string): boolean {
  return /"tool"\s*:\s*"onyx_[^"]+"/.test(text) || /```tool-use/.test(text);
}

