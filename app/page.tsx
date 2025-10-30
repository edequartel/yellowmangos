// No globals.css import here; it's loaded in layout.tsx
import Link from "next/link";
import { listPosts } from "@/lib/md";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await listPosts();
  return (
    <main>
      <h1>Yellow Mangoes 🍋🥭</h1>
      <p>Drop <code>.md</code> files in <code>/content</code>. Each becomes a page.</p>
      <ul className="list-disc pl-6">
        {posts.map(p => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title}</a>
            {p.date && <span className="ml-2 text-sm opacity-70">({new Date(p.date).toLocaleDateString()})</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
