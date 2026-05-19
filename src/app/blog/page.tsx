import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getBlogPosts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Injects the article number+title+subtitle into the content HTML.
 *  If the content starts with a floated <img>, the title goes AFTER it
 *  so it renders beside the image. Otherwise it's prepended. */
function buildContentHtml(
  content: string,
  index: number,
  title: string,
  subtitle: string | null
): string {
  const num = String(index + 1).padStart(2, "0");
  const titleHtml =
    `<div style="margin-bottom:0.5rem">` +
    `<span style="font-size:11px;font-style:italic;font-weight:300;color:#5b2525;margin-right:0.5rem">${num}/</span>` +
    `<span style="font-family:'Playfair Display',Georgia,serif;font-size:1.875rem;font-weight:400;color:#5b2525;line-height:1.2">${title}</span>` +
    `</div>` +
    (subtitle
      ? `<p style="font-family:'Playfair Display',Georgia,serif;font-size:0.875rem;font-style:italic;color:rgba(91,37,37,0.7);margin-top:0;margin-bottom:0.75rem;padding-left:2rem">${subtitle}</p>`
      : "");

  const trimmed = content.trimStart();
  if (trimmed.startsWith("<img")) {
    // Content begins with an image — inject title after it so it flows beside the float
    const end = trimmed.indexOf(">") + 1;
    return trimmed.slice(0, end) + titleHtml + trimmed.slice(end);
  }
  return titleHtml + content;
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

  return (
    <>
      {/* Posts */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 lg:pt-32">
        <h1 className="mb-10 text-center font-playfair text-5xl font-normal leading-[1.1] text-brand lg:text-7xl">
          BLOG
        </h1>
        <div className="divide-y divide-neutral-400/50">
          {blogPosts.map((post, index) => {
            const isEven = index % 2 === 0;
            return (
              <article key={post.id} id={`post-${post.id}`} className="py-10">
                <div
                  className={`flex flex-col gap-6 lg:flex-row lg:items-start ${
                    isEven ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Featured image (from post.image field) */}
                  {post.image && (
                    <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden lg:w-[38%]">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 420px"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    {post.content ? (
                      // Rich text: title is injected inside the HTML so it flows beside floated images
                      <div
                        className="blog-content prose prose-sm max-w-none text-neutral-900 overflow-hidden [&_h1]:font-playfair [&_h1]:text-2xl [&_h1]:text-brand [&_h2]:font-playfair [&_h2]:text-xl [&_h2]:text-brand [&_h3]:font-playfair [&_h3]:text-lg [&_h3]:text-brand [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-600 [&_img]:max-w-full [&_img]:my-2 [&_hr]:border-neutral-200 [&_p]:leading-[1.9] [&_p]:text-sm [&_p]:break-words"
                        dangerouslySetInnerHTML={{
                          __html: buildContentHtml(post.content, index, post.title, post.subtitle),
                        }}
                      />
                    ) : (
                      // Legacy paragraphs fallback — keep title above
                      <>
                        <div className="flex items-baseline gap-4">
                          <span className="text-[11px] font-light italic text-brand">
                            {String(index + 1).padStart(2, "0")}/
                          </span>
                          <h2 className="font-playfair text-2xl font-normal text-brand lg:text-3xl">
                            {post.title}
                          </h2>
                        </div>
                        {post.subtitle && (
                          <p className="mt-1 pl-8 font-playfair text-sm italic text-brand/70">
                            {post.subtitle}
                          </p>
                        )}
                        <div className="mt-4 space-y-4">
                          {post.paragraphs.map((p: string, i: number) => (
                            <p key={i} className="text-sm leading-[1.9] text-neutral-900">
                              {p}
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
