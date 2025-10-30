import { getPost, listMarkdownSlugs } from "@/lib/md";

type Params = { slug: string };

export async function generateStaticParams() {
  const slugs = await listMarkdownSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { meta } = await getPost(params.slug);
  return { title: meta.title, description: `Markdown: ${meta.title}` };
}

export default async function PostPage({ params }: { params: Params }) {
  const { meta, html } = await getPost(params.slug);
  return (
    <main>
      <h1>{meta.title}</h1>
      {meta.date && <p className="opacity-70 text-sm">{new Date(meta.date).toLocaleString()}</p>}
      <article dangerouslySetInnerHTML={{ __html: html }} />
      <hr />
      <p><a href="/">← Back to all files</a></p>
    </main>
  );
}
