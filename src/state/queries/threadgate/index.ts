import {AppBskyFeedThreadgate, AtUri, BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export * from '#/state/queries/threadgate/types'
export * from '#/state/queries/threadgate/util'

export const threadgateRecordQueryKeyRoot = 'threadgate-record'
export const createThreadgateRecordQueryKey = (uri: string) => [
  threadgateRecordQueryKeyRoot,
  uri,
]

export function useThreadgateRecordQuery({
  postUri,
  initialData,
}: {
  postUri?: string
  initialData?: AppBskyFeedThreadgate.Record
} = {}) {
  const agent = useAgent()

  return useQuery({
    enabled: !!postUri,
    queryKey: createThreadgateRecordQueryKey(postUri || ''),
    placeholderData: initialData,
    async queryFn() {
      const urip = new AtUri(postUri!)

      if (!urip.host.startsWith('did:')) {
        const res = await agent.resolveHandle({
          handle: urip.host,
        })
        urip.host = res.data.did
      }

      const {value} = await agent.api.app.bsky.feed.threadgate.get({
        repo: urip.host,
        rkey: urip.rkey,
      })

      return value
    },
  })
}

export function createThreadgate({
  agent,
  postUri,
  threadgate,
}: {
  agent: BskyAgent
  postUri: string
  threadgate: Partial<AppBskyFeedThreadgate.Record>
}) {
  const urip = new AtUri(postUri)
  const record = {
    ...threadgate,
    post: postUri,
    createdAt: new Date().toISOString(),
  }

  return agent.api.app.bsky.feed.threadgate.create(
    {
      repo: urip.host,
      rkey: urip.rkey,
    },
    record,
  )
}