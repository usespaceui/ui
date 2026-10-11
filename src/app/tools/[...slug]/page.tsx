import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resourcesSource as source } from '@/lib/source'
import { LibraryLayoutWrapper } from '@/components/layout/library-layout-wrapper'
import { ResourcesMdx } from '../resources-mdx'

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await props.params
  if (
    slug[0] === 'avatars' ||
    slug[0] === 'squishmoji' ||
    slug[0] === 'emoji' ||
    slug[0] === 'imagesplit' ||
    slug[0] === 'og-image' ||
    slug[0] === '_empty'
  )
    notFound()
  return (
    <LibraryLayoutWrapper>
      <ResourcesMdx slug={slug} />
    </LibraryLayoutWrapper>
  )
}

export async function generateStaticParams() {
  const params = source
    .generateParams()
    .filter(
      (params) =>
        params.slug?.[0] &&
        params.slug[0] !== 'avatars' &&
        params.slug[0] !== 'squishmoji' &&
        params.slug[0] !== 'emoji' &&
        params.slug[0] !== 'imagesplit' &&
        params.slug[0] !== 'og-image',
    )

  if (params.length === 0) {
    return [{ slug: ['_empty'] }]
  }

  return params
}

export async function generateMetadata(props: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await props.params
  if (slug[0] === '_empty') return {}
  const page = source.getPage(slug)
  const image = '/og-image.png'
  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: 'https://www.spaceui.one',
      siteName: 'Space UI',
      images: image,
      locale: 'en_US',
      type: 'website',
    },
  }
}

export const instant = false
