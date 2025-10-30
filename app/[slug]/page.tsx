import type { Metadata } from "next";
import { getPost, listMarkdownSlugs } from "@/lib/md";

type SlugParams = { slug: string };

// Pre-generate all slugs at build time
export async function generateStaticParams(): Promise<SlugParams[]> {
  const slugs = await listMarkdownSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Metadata per page (typed)
export async function generateMetadata(
  { params }: { params: SlugParams }
): Promise<Metadata> {
  const { meta } = await getPost(params.slug);
  return {
    title: meta.title,
    description: `Markdown: ${meta.title}`
  };
}

// Actual page (typed props)
export default async function Page(
  { params }: { params: SlugParams }
) {
  const { meta, html } = await getPost(params.slug);

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