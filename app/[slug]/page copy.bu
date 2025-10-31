import type { Metadata } from "next";
import { getPost, listMarkdownSlugs } from "@/lib/md";

type SlugParams = { slug: string };

// Pre-generate all slugs at build time
export async function generateStaticParams(): Promise<SlugParams[]> {
  const slugs = await listMarkdownSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Next 15 types: params is a Promise → await it
export async function generateMetadata(
  { params }: { params: Promise<SlugParams> }
): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPost(slug);
  return {
    title: meta.title,
    description: `Markdown: ${meta.title}`,
  };
}

// Page component: params is a Promise → await it
export default async function Page(
  { params }: { params: Promise<SlugParams> }
) {
  const { slug } = await params;
  const { meta, html } = await getPost(slug);

  return (
    <main>
      <h1>{meta.title}</h1>
      {meta.date && (
        <p className="opacity-70 text-sm">
          {new Date(meta.date).toLocaleString()}
        </p>
      )}
      <article dangerouslySetInnerHTML={{ __html: html }} />
      <hr />
      <p><a href="/">← Back to all files</a></p>
    </main>
  );
}