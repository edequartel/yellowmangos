// app/page.tsx
import Link from "next/link";
import { listPosts, type PostMeta } from "@/lib/md";

export const revalidate = 60;

type TreeNode = {
  files: PostMeta[];                  // markdown files directly in this folder
  children: Map<string, TreeNode>;    // subfolders
};

/** Build a nested tree from slugPath like "guides/setup" or "welcome" */
function buildTree(posts: PostMeta[]): TreeNode {
  const root: TreeNode = { files: [], children: new Map() };

  for (const p of posts) {
    const parts = p.slugPath.split("/").filter(Boolean);
    let node = root;

    // walk/create folder nodes for all but the last segment (file)
    for (let i = 0; i < Math.max(parts.length - 1, 0); i++) {
      const seg = parts[i];
      if (!node.children.has(seg)) node.children.set(seg, { files: [], children: new Map() });
      node = node.children.get(seg)!;
    }

    // file “lives” in the folder node
    node.files.push(p);
  }

  return root;
}

/** Title-case a folder label */
function titleize(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Recursively render the tree. `path` is the accumulated URL path for nested folders. */
function RenderTree({ node, path = "" }: { node: TreeNode; path?: string }) {
  // Sort files by date desc then title asc (same as your listPosts)
  const files = [...node.files].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  const children = [...node.children.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-6">
      {files.length > 0 && (
        <ul className="list-disc pl-6">
          {files.map((p) => (
            <li key={p.slugPath}>
              <Link href={`/${p.slugPath}`}>{p.title}</Link>
              {p.date && (
                <span className="ml-2 text-sm opacity-70">
                  ({new Date(p.date).toLocaleDateString()})
                </span>
              )}
              <span className="ml-2 opacity-60 text-xs">/{p.slugPath}</span>
            </li>
          ))}
        </ul>
      )}

      {children.map(([folder, child]) => {
        const childPath = path ? `${path}/${folder}` : folder;
        return (
          <section key={childPath} className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">{titleize(folder)}</h2>
            <RenderTree node={child} path={childPath} />
          </section>
        );
      })}
    </div>
  );
}

export default async function HomePage() {
  const posts = await listPosts();
  const tree = buildTree(posts);

  // files at the repository root (content/*.md without subfolder)
  const hasRootFiles = tree.files.length > 0;

  return (
    <main>
      <h1>Yellow Mangoes 🍋🥭</h1>
      <p className="mb-6">
        Put <code>.md</code> anywhere under <code>/content</code>. Folders appear below as
        headers; files are nested in a tree that mirrors the folder structure.
      </p>

      {hasRootFiles && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Root</h2>
          <RenderTree node={{ ...tree, children: new Map() }} />
        </section>
      )}

      {/* Render top-level folders (hide root files from this listing by passing only children) */}
      {[...tree.children.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([folder, child]) => (
          <section key={folder} className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">{titleize(folder)}</h2>
            <RenderTree node={child} path={folder} />
          </section>
        ))}
    </main>
  );
}