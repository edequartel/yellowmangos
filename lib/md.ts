// lib/md.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type PostMeta = {
  title: string;
  date?: string;
  /** Slash-separated path without ".md", e.g. "guides/setup" */
  slugPath: string;
};

/** Recursively collect all .md files under /content and return paths without ".md" */
export async function listMarkdownPaths(): Promise<string[]> {
  async function walk(dir: string, relBase = ""): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(relBase, e.name); // POSIX slashes
      if (e.isDirectory()) {
        out.push(...(await walk(abs, rel)));
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        out.push(rel.replace(/\.md$/i, "")); // strip ".md"
      }
    }
    return out;
  }
  return walk(CONTENT_DIR);
}

/** Load one post by slug parts (["folder","file"]) or a single string ("file") */
export async function getPost(slug: string | string[]): Promise<{
  meta: PostMeta;
  html: string;
}> {
  const slugPath = Array.isArray(slug) ? slug.join("/") : slug;
  const fullPath = path.join(CONTENT_DIR, slugPath + ".md");
  const raw = await fs.readFile(fullPath, "utf8");
  const { content, data } = matter(raw);
  const { value: html } = await remark().use(remarkGfm).use(remarkHtml).process(content);

  const fileBaseName = slugPath.split("/").pop()!;
  const title =
    (typeof data.title === "string" && data.title.trim()) ||
    fileBaseName.replace(/[-_]/g, " ");

  const date =
    typeof data.date === "string" ? new Date(data.date).toISOString() : undefined;

  return { meta: { title, date, slugPath }, html };
}

/** List all posts’ metadata, newest first if a date is present */
export async function listPosts(): Promise<PostMeta[]> {
  const paths = await listMarkdownPaths();
  const metas = await Promise.all(paths.map(async (p) => (await getPost(p)).meta));
  return metas.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
}