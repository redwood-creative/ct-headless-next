# ClickTailors (clicktailors.com)

Next.js site for ClickTailors. Blog posts and legal pages are Markdown files in
this repo. WordPress is no longer needed.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build; every blog post is statically generated
```

## Content

```
content/
  posts/<slug>.md     -> /blog/posts/<slug>
  pages/<slug>.md     -> /<slug>   (privacy-policy, terms-of-service)
public/blog-media/    -> images and video used by posts (/blog-media/…)
```

Each Markdown file starts with YAML frontmatter. See
[`content/posts/_template.md`](content/posts/_template.md) for every field.

### Publishing a post

1. Copy `content/posts/_template.md` to `content/posts/my-new-post.md`.
2. Fill in the frontmatter and write the body in Markdown. Inline HTML is allowed.
3. Put images in `public/blog-media/<yyyy>/<mm>/` and reference them as
   `/blog-media/<yyyy>/<mm>/file.png`.
4. Remove `draft: true` when it's ready, then commit and push. Vercel rebuilds the site.

`lib/blog.ts` reads the files at build time and renders the Markdown with
[`marked`](https://marked.js.org). The sitemap (`/sitemap.xml`) and RSS feed
(`/feed.xml`) are generated from the same files.

## History: the WordPress export

The content was originally served from a headless WordPress install
(`wp.clicktailors.com`). `scripts/export-wordpress.mjs` (`pnpm export-wordpress`)
did the one-time export. It converted posts and pages to Markdown, downloaded
every image and video from the droplet into `public/blog-media/`, and transcoded
the `.mov` screen recording to `.mp4`. The script is kept for reference. It can't
run again once the droplet is gone.
