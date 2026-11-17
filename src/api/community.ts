import client from './client'

export type BoardDto = { id: number; name: string; cohort?: number | null; sortOrder: number }
export type CommunityPostDto = {
  id: number
  boardId: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  isMine: boolean
  authorLabel: string
}
export type CommunityPostPreviewDto = Omit<CommunityPostDto, 'content'> & { preview: string }
export type CommunityCommentDto = {
  id: number
  content: string
  createdAt: string
  updatedAt: string
  isMine: boolean
  authorLabel: string
}
type Page<T> = { items: T[]; page: number; size: number; hasNext: boolean }
export type MyCommentDto = { id: number; postId: number; postTitle?: string | null; content: string; createdAt: string; isMine: boolean }

export async function getBoards() {
  const { data } = await client.get<Record<string, BoardDto[]>>('/api/community/boards')
  return Object.values(data).flat()
}

export async function getPosts(params: { boardId?: number; keyword?: string; page?: number; size?: number }) {
  const { data } = await client.get<Page<CommunityPostPreviewDto>>('/api/community/posts', { params })
  return data
}

export async function getPost(id: string) {
  const { data } = await client.get<CommunityPostDto>(`/api/community/posts/${encodeURIComponent(id)}`)
  return data
}

export async function createPost(request: { boardId: number; title: string; content: string }) {
  const { data } = await client.post<CommunityPostDto>('/api/community/posts', request)
  return data
}

export async function updatePost(id: string, request: { title: string; content: string }) {
  const { data } = await client.patch<CommunityPostDto>(`/api/community/posts/${encodeURIComponent(id)}`, request)
  return data
}

export async function deletePost(id: string) {
  await client.delete(`/api/community/posts/${encodeURIComponent(id)}`)
}

export async function getComments(postId: string) {
  const { data } = await client.get<Page<CommunityCommentDto>>(
    `/api/community/posts/${encodeURIComponent(postId)}/comments`,
    { params: { page: 0, size: 100 } },
  )
  return data.items
}

export async function getMyPosts(params: { page?: number; size?: number } = {}) {
  const { data } = await client.get<Page<CommunityPostPreviewDto>>('/api/community/me/posts', { params })
  return data
}

export async function getMyComments(params: { page?: number; size?: number } = {}) {
  const { data } = await client.get<Page<MyCommentDto>>('/api/community/me/comments', { params })
  return data
}

export async function createComment(postId: string, content: string) {
  const { data } = await client.post<CommunityCommentDto>(
    `/api/community/posts/${encodeURIComponent(postId)}/comments`,
    { content },
  )
  return data
}

export async function deleteComment(id: string) {
  await client.delete(`/api/community/comments/${encodeURIComponent(id)}`)
}

export async function updateComment(id: string, content: string) {
  const { data } = await client.patch<CommunityCommentDto>(`/api/community/comments/${encodeURIComponent(id)}`, { content })
  return data
}

export async function setPostLike(postId: string, liked: boolean) {
  const path = `/api/community/posts/${encodeURIComponent(postId)}/like`
  if (liked) await client.put(path)
  else await client.delete(path)
}

export async function reportCommunityItem(targetType: 'POST' | 'COMMENT', targetId: string, reasonCode: string) {
  await client.post('/api/community/reports', { targetType, targetId: Number(targetId), reasonCode })
}
