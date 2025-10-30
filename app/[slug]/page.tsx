import { getPost, listMarkdownSlugs } from "@/lib/md";

export async function generateStaticParams() {
  const slugs = await listMarkdownSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { meta } = await getPost(params.slug);
  return { title: meta.title };
}

export default async function PostPage({ params }) {
  const { meta, html } = await getPost(params.slug);
  return (
    <main>
      <h1>{meta.title}</h1>
      <article dangerouslySetInnerHTML={{ __html: html }} />
      <p><a href="/">← Back</a></p>
    </main>
  );
}
