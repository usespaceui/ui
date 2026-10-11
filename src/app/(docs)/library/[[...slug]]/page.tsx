import { notFound, redirect } from 'next/navigation'
import { getMDXComponents } from '@/mdx-components'
import { createRelativeLink } from 'fumadocs-ui/mdx'

import { librarySource as source } from '@/lib/source'
import { getDocsNeighbours } from '@/lib/docs-nav'
import { RelatedComponents } from '@/components/docs/layout/related-components'
import { getLibraryCatalog, isCatalogIndex } from '@/lib/catalog'
import { DocsPageHeader } from '@/components/docs/layout/docs-page-header'
import { DocsPager } from '@/components/docs/layout/docs-pager'
import { DocsTocSidebar } from '@/components/docs/layout/docs-toc-sidebar'
import { Footer } from '@/components/docs/layout/footer'
import { getDocMetadata } from '@/lib/docs-metadata'

import { PageLayoutSync } from '@/components/docs/layout/page-layout-sync'
import { ComponentPreview } from '@/components/docs/preview/preview'
import { normalizePreviewConfig, Mode } from '@/config/preview-config'
import { OpenRunde } from '@/registry/lib/fonts/open-runde'
import { cn } from '@/registry/lib/utils'

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await props.params
  if (!slug.length) return { title: 'Library' }
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
  if (!params.slug || params.slug.length === 0) {
    redirect('/components')
  }
  const page = source.getPage(params.slug)

  if (!page) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = page.data as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MDXContent = pageData.body as any

  const showCatalog = isCatalogIndex(params.slug)
  const docMeta = showCatalog
    ? { dependencies: [], registryDependencies: [], relatedComponents: [] }
    : await getDocMetadata(params.slug)
  const { prev: prevNav, next: nextNav } = getDocsNeighbours(source, page.url)

  const isBlocksOrComponents =
    params.slug?.[0] === 'blocks' ||
    params.slug?.[0] === 'components' ||
    page.url.startsWith('/blocks') ||
    page.url.startsWith('/components')
  const catalog = showCatalog ? getLibraryCatalog(params.slug) : []

  const previewConfig = normalizePreviewConfig(pageData.preview)
  const isTemplate =
    params.slug?.[0] === 'templates' ||
    page.url.startsWith('/templates') ||
    Boolean(previewConfig?.name.startsWith('template-'))
  const isInteractions =
    params.slug?.[0] === 'interactions' ||
    page.url.startsWith('/interactions') ||
    page.url.startsWith('/library/interactions')

  return (
    <>
      <PageLayoutSync
        mode={showCatalog ? Mode.standard : pageData.mode}
        defaultMode={showCatalog ? Mode.standard : pageData.defaultMode}
        path={`library/${page.path}`}
        preview={showCatalog ? null : pageData.preview}
        title={pageData.title}
      />
      <div
        className={cn(
          'flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full',
          isInteractions &&
            cn(
              OpenRunde.variable,
              'font-open-runde!',
              '[--font-body:var(--font-open-runde),sans-serif]! [--font-heading:var(--font-open-runde),sans-serif]! [--font-sans:var(--font-open-runde),sans-serif]!',
            ),
        )}
      >
        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              'mx-auto flex w-full min-w-0 flex-1 flex-col gap-8 px-4 pt-8 pb-32 md:px-8 md:pt-8 md:pb-32 lg:pt-10 lg:pb-36 text-foreground',
              showCatalog ? 'max-w-6xl 2xl:max-w-7xl' : 'xl:max-w-3xl 2xl:max-w-4xl',
            )}
          >
            {/* Page Header */}
            <DocsPageHeader
              title={pageData.title}
              description={pageData.description}
              slug={['library', ...(params.slug ?? [])]}
              path={`library/${page.path}`}
              url={page.url}
              docMeta={docMeta}
              lastModified={pageData.lastModified}
              prevNav={prevNav}
              nextNav={nextNav}
              showMetadata={!showCatalog}
              showPageActions={!showCatalog}
            />

            {/* Markdown Body */}
            {!showCatalog && (
              <div className="w-full flex-1 prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-m-24 *:data-[slot=alert]:first:mt-0">
                {!showCatalog && previewConfig && !isTemplate && <ComponentPreview {...previewConfig} />}

                <MDXContent
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  components={
                    getMDXComponents({
                      a: createRelativeLink(source, page),
                    }) as any
                  }
                />
              </div>
            )}

            {showCatalog && <RelatedComponents id="catalog" groups={catalog} />}

            {isBlocksOrComponents && !showCatalog && <Footer />}

            <RelatedComponents items={docMeta.relatedComponents} />

            {/* Bottom Navigation Cards */}
            <DocsPager prev={prevNav} next={nextNav} />
          </div>
        </div>

        {/* Right Sidebar / TOC */}
        {!showCatalog && (
          <DocsTocSidebar
            toc={pageData.toc}
            dependencies={docMeta.dependencies}
            hasRelated={docMeta.relatedComponents.length > 0}
          />
        )}
      </div>
    </>
  )
}

export const instant = false
