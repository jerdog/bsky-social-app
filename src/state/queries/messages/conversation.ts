import {ChatBskyConvoDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useOnMarkAsRead} from '#/state/queries/messages/list-converations'
import {useAgent} from '#/state/session'
import {RQKEY as LIST_CONVOS_KEY} from './list-converations'

const RQKEY_ROOT = 'convo'
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId]

export function useConvoQuery(convo: ChatBskyConvoDefs.ConvoView) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(convo.id),
    queryFn: async () => {
      const {data} = await agent.api.chat.bsky.convo.getConvo(
        {convoId: convo.id},
        {headers: DM_SERVICE_HEADERS},
      )
      return data.convo
    },
    initialData: convo,
    staleTime: STALE.INFINITY,
  })
}

export function useMarkAsReadMutation() {
  const optimisticUpdate = useOnMarkAsRead()
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      convoId,
      messageId,
    }: {
      convoId?: string
      messageId?: string
    }) => {
      if (!convoId) throw new Error('No convoId provided')

      await agent.api.chat.bsky.convo.updateRead(
        {
          convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers: DM_SERVICE_HEADERS,
        },
      )
    },
    onMutate({convoId}) {
      if (!convoId) throw new Error('No convoId provided')
      optimisticUpdate(convoId)
    },
    onSettled() {
      queryClient.invalidateQueries({queryKey: LIST_CONVOS_KEY})
    },
  })
}
