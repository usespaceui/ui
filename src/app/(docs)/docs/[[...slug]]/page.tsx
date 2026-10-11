import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/mdx-components'
import { createRelativeLink } from 'fumadocs-ui/mdx'

import { source } from '@/lib/source'
import { getDocsNeighbours } from '@/lib/docs-nav'
import { RelatedComponents } from '@/components/docs/layout/related-components'
import { DocsPageHeader } from '@/components/docs/layout/docs-page-header'
import { DocsPager } from '@/components/docs/layout/docs-pager'
import { getDocMetadata } from '@/lib/docs-metadata'
import { PageLayoutSync } from '@/components/docs/layout/page-layout-sync'
import { Mode } from '@/config/preview-config'

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const image = '/og-image.png'

  return {
    title: page.data.title,
    description: page.data.description,
    authors: page.data?.author
      ? [
          {
            name: page.data.author.name,
            ...(page.data.author?.url && { url: page.data.author.url }),
          },
        ]
      : {
          name: 'usespaceui',
          url: 'https://github.com/usespaceui',
        },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: 'https://www.spaceui.one',
      siteName: 'Space UI',
      images: image,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@space_ui',
      title: page.data.title,
      description: page.data.description,
      images: image,
    },
  }
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)

  if (!page) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = page.data as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MDXContent = pageData.body as any

  const docMeta = await getDocMetadata(params.slug)
  const { prev: prevNav, next: nextNav } = getDocsNeighbours(source, page.url)

  return (
    <>
      <PageLayoutSync
        mode={Mode.standard}
        defaultMode={Mode.standard}
        path={`docs/${page.path}`}
        title={pageData.title}
      />
      <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full xl:max-w-3xl 2xl:max-w-4xl min-w-0 flex-1 flex-col gap-8 px-4 pt-8 pb-32 md:px-8 md:pt-8 md:pb-32 lg:pt-10 lg:pb-36 text-foreground">
            {/* Page Header */}
            <DocsPageHeader
              title={pageData.title}
              description={pageData.description}
              slug={['docs', ...(params.slug ?? [])]}
              path={`docs/${page.path}`}
              url={page.url}
              docMeta={docMeta}
              lastModified={pageData.lastModified}
              prevNav={prevNav}
              nextNav={nextNav}
            />

            {/* Markdown Body */}
            <div className="w-full flex-1 prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-m-24 *:data-[slot=alert]:first:mt-0">
              <MDXContent
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                components={
                  getMDXComponents({
                    a: createRelativeLink(source, page),
                  }) as any
                }
              />
            </div>

            {/* Related Components 3-Card Grid */}
            <RelatedComponents items={docMeta.relatedComponents} />

            {/* Bottom Navigation Cards */}
            <DocsPager prev={prevNav} next={nextNav} />
          </div>
        </div>
      </div>
    </>
  )
}

export const instant = false
