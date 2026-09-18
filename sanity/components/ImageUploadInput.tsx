'use client'

import {useEffect, useMemo, useState} from 'react'
import {type ArrayOfObjectsInputProps, useClient} from 'sanity'
import styled from 'styled-components'

type ImageEntry = {
  _key: string
  asset?: {_ref?: string}
  alt?: string
  caption?: string
}

type ImageAsset = {
  _id: string
  url?: string
  originalFilename?: string
}

// Scope the column override to this array's native grid, excluding item dialogs.
const ImageGrid = styled.div`
  [data-ui='ArrayInput__content'] > [data-ui='Card'] > [data-ui='Grid'] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const SearchInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--card-border-color, #888);
  border-radius: 4px;
  background: var(--card-bg-color, transparent);
  color: inherit;
  font: inherit;
`

export function ImageUploadInput(props: ArrayOfObjectsInputProps<ImageEntry>) {
  const client = useClient({apiVersion: '2026-01-01'})
  const [search, setSearch] = useState('')
  const [assets, setAssets] = useState<ImageAsset[]>([])
  const [request, setRequest] = useState({ids: '', error: false})
  const assetIds = JSON.stringify(
    [...new Set((props.value ?? []).flatMap((image) => image.asset?._ref ? [image.asset._ref] : []))].sort(),
  )

  useEffect(() => {
    let cancelled = false
    const ids: string[] = JSON.parse(assetIds)
    if (!ids.length) return

    client.fetch<ImageAsset[]>(
      '*[_type == "sanity.imageAsset" && _id in $ids]{_id, url, originalFilename}',
      {ids},
    ).then((result) => {
      if (!cancelled) {
        setAssets(result)
        setRequest({ids: assetIds, error: false})
      }
    }).catch(() => {
      if (!cancelled) setRequest({ids: assetIds, error: true})
    })

    return () => { cancelled = true }
  }, [assetIds, client])

  const status = assetIds === '[]' ? 'ready' : request.ids !== assetIds ? 'loading' : request.error ? 'error' : 'ready'

  const assetsById = useMemo(() => new Map(assets.map((asset) => [asset._id, asset])), [assets])
  const query = search.trim().toLowerCase()
  const matchingKeys = new Set((props.value ?? []).filter((image) => {
    const asset = assetsById.get(image.asset?._ref ?? '')
    return [image._key, image.asset?._ref, image.alt, image.caption, asset?.url, asset?.originalFilename]
      .some((value) => value?.toLowerCase().includes(query))
  }).map((image) => image._key))
  // Filter only the visible members; preserve the complete value and keyed edits.
  const members = query
    ? props.members.filter((member) => member.kind !== 'item' || matchingKeys.has(member.key))
    : props.members

  return (
    <div>
      <SearchInput
        type="search"
        aria-label="Search images by ID, URL, filename, alt text, or caption"
        placeholder="Search by ID, URL, filename, alt text, or caption…"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <div role="status">
        {status === 'loading' && <p>Loading image details…</p>}
        {status === 'error' && <p>Could not load filenames and URLs. You can still search by ID, alt text, or caption.</p>}
        {query && <p>{matchingKeys.size} of {props.value?.length ?? 0} images match</p>}
      </div>
      <ImageGrid>
        {props.renderDefault({
          ...props,
          members,
          schemaType: {
            ...props.schemaType,
            options: {...props.schemaType.options, sortable: !query},
          },
        })}
      </ImageGrid>
    </div>
  )
}
