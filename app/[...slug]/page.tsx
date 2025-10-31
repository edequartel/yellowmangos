import type { Metadata } from "next";
import { getPost, listMarkdownPaths } from "@/lib/md";

type CatchAll = { slug: string[] };

export async function generateStaticParams(): Promise<CatchAll[]> {
  const paths = await listMarkdownPaths();
  return paths.map((p) => ({ slug: p.split("/") })); // arrays for catch-all
}

export async function generateMetadata(
  { params }: { params: Promise<CatchAll> }
): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPost(slug);
  return { title: meta.title, description: `Markdown: ${meta.title}` };
}

export default async function Page(
  { params }: { params: Promise<CatchAll> }
) {
  const { slug } = await params;
  const { meta, html } = await getPost(slug);
  return (
    <main>
//      <h1>{meta.title}</h1>
      <p><a href="/">← Back to all files</a></p>
      {meta.date && <p className="opacity-70 text-sm">{new Date(meta.date).toLocaleString()}</p>}
      <article dangerouslySetInnerHTML={{ __html: html }} />
      <hr />

    </main>
  );
}