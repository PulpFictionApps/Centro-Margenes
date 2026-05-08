import Image from "next/image";
import { blogPosts } from "@/lib/blog";

export default function BlogPage() {
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
                  {/* Image */}
                  <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden lg:w-[38%]">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 420px"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4">
                      <span className="text-[11px] font-light italic text-brand">{post.id}/</span>
                      <h2 className="font-playfair text-2xl font-normal text-brand lg:text-3xl">
                        {post.title}
                      </h2>
                    </div>
                    {post.subtitle && (
                      <p className="mt-1 pl-8 font-playfair text-sm italic text-brand/70">
                        {post.subtitle}
                      </p>
                    )}
                    <div className="mt-6 space-y-4">
                      {post.paragraphs.map((p, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-neutral-600">
                          {p}
                        </p>
                      ))}
                    </div>
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
