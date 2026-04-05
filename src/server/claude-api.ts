import fs from "node:fs";
import path from "node:path";
import type { ViteDevServer } from "vite";

const CLAUDE_DIR = path.resolve(process.cwd(), ".claude");
const SKILLS_DIR = path.join(CLAUDE_DIR, "skills");
const AGENTS_DIR = path.join(CLAUDE_DIR, "agents");

const CATEGORY_MAP: Record<string, string> = {
  "game-architecture": "Game Design",
  "generate-npc": "Game Design",
  "generate-quest": "Game Design",
  "brand-and-tone": "Assets & Art",
  "generate-svg-sprite": "Assets & Art",
  "visual-scaling": "Assets & Art",
  "nano-banana": "Assets & Art",
  "test-wave": "Workflow",
  "coding-style": "Workflow",
};

interface SkillEntry {
  name: string;
  description: string;
  category: string;
  path: string;
}

interface AgentEntry {
  name: string;
  role: string;
  description: string;
  path: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

function parseAgentMd(content: string, filename: string): AgentEntry {
  const lines = content.split("\n").filter((l) => l.trim());
  let name = filename.replace(/\.md$/, "");
  let role = "";
  let description = "";

  for (const line of lines) {
    if (line.startsWith("# ") && !name) {
      name = line.slice(2).trim();
    }
    if (line.toLowerCase().includes("role:")) {
      role = line.replace(/.*role:\s*/i, "").trim();
    }
  }

  // Extract first meaningful paragraph as description
  const bodyStart = content.indexOf("\n\n");
  if (bodyStart > 0) {
    const para = content.slice(bodyStart).trim().split("\n\n")[0];
    if (para && !para.startsWith("#") && !para.startsWith("---")) {
      description = para.replace(/\n/g, " ").slice(0, 200);
    }
  }

  return { name, role, description, path: path.join(AGENTS_DIR, filename) };
}

function listSkills(): SkillEntry[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills: SkillEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, "utf-8");
    const fm = parseFrontmatter(content);

    skills.push({
      name: fm.name || entry.name,
      description: fm.description || "",
      category: CATEGORY_MAP[entry.name] || "Custom",
      path: skillFile,
    });
  }

  return skills;
}

function getSkillContent(name: string): string | null {
  const skillFile = path.join(SKILLS_DIR, name, "SKILL.md");
  if (!fs.existsSync(skillFile)) return null;
  return fs.readFileSync(skillFile, "utf-8");
}

function saveSkill(name: string, content: string): void {
  const skillDir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), content, "utf-8");
}

function listAgents(): AgentEntry[] {
  if (!fs.existsSync(AGENTS_DIR)) return [];

  const entries = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md"));
  return entries.map((filename) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, filename), "utf-8");
    return parseAgentMd(content, filename);
  });
}

export function claudeApiPlugin() {
  return {
    name: "claude-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/claude/")) return next();

        res.setHeader("Content-Type", "application/json");

        // GET /api/claude/skills
        if (req.url === "/api/claude/skills" && req.method === "GET") {
          res.end(JSON.stringify(listSkills()));
          return;
        }

        // GET /api/claude/skills/:name
        const skillMatch = req.url.match(/^\/api\/claude\/skills\/([^/]+)$/);
        if (skillMatch && req.method === "GET") {
          const content = getSkillContent(skillMatch[1]);
          if (content === null) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Skill not found" }));
            return;
          }
          res.end(JSON.stringify({ name: skillMatch[1], content }));
          return;
        }

        // PUT /api/claude/skills/:name
        if (skillMatch && req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { content } = JSON.parse(body);
              if (!content || typeof content !== "string") {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "content field required" }));
                return;
              }
              saveSkill(skillMatch[1], content);
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid JSON body" }));
            }
          });
          return;
        }

        // GET /api/claude/agents
        if (req.url === "/api/claude/agents" && req.method === "GET") {
          res.end(JSON.stringify(listAgents()));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      });
    },
  };
}
