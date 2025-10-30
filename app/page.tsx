import "./globals.css";
import Link from "next/link";
import { listPosts } from "@/lib/md";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await listPosts();
  return (
    <main>
      <h1>Yellow Mangoes 🍋🥭</h1>
      <p>Markdown files in /content appear here.</p>
      <ul className="list-disc pl-6">
        {posts.map(p => (
          <li key={p.slug}>
            <Link href={`/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
