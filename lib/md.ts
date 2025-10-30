import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type PostMeta = { title: string; date?: string; slug: string };

export async function listMarkdownSlugs(): Promise<string[]> {
  const files = await fs.readdir(CONTENT_DIR);
  return files.filter(f => f.endsWith(".md")).map(f => f.replace(/\.md$/, ""));
}

export async function getPost(slug: string) {
  const fullPath = path.join(CONTENT_DIR, `${slug}.md`);
  const raw = await fs.readFile(fullPath, "utf8");
  const { content, data } = matter(raw);
  const { value: html } = await remark().use(remarkGfm).use(remarkHtml).process(content);
  const title = typeof data.title === "string" ? data.title.trim() : slug.replace(/[-_]/g, " ");
  const date = typeof data.date === "string" ? new Date(data.date).toISOString() : undefined;
  return { meta: { title, date, slug }, html };
}

export async function listPosts() {
  const slugs = await listMarkdownSlugs();
  const posts = await Promise.all(slugs.map(s => getPost(s)));
  return posts.map(p => p.meta).sort((a, b) => (a.date && b.date ? b.date.localeCompare(a.date) : a.title.localeCompare(b.title)));
}
