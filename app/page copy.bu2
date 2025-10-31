// app/page.tsx
import Link from "next/link";
import { listPosts } from "@/lib/md";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await listPosts();

  return (
    <main>
      <h1>Yellow Mangoes 🍋🥭</h1>
      <p>
        Place <code>.md</code> files anywhere under <code>/content</code>.  
        Subfolders are supported; each file becomes a route that mirrors its path.
      </p>

      <ul className="list-disc pl-6">
        {posts.map((p) => (
          <li key={p.slugPath}>
            {/* p.slugPath is already "folder/file" form */}
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
    </main>
  );
}