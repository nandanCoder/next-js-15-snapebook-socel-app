"use client";
import { PostsPage } from "@/types/prisma.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import Post from "@/components/posts/Post";
import KyInstance from "@/lib/ky";
import InfiniteScrollContainer from "../InfiniteScrollContainer";
import PostsLoadingSkeleton, {
  PostLoadingSkeleton,
} from "../posts/PostsLoadingSkeleton";
interface UserPostsProps {
  userId: string;
}
export default function UserPosts({ userId }: UserPostsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "user-posts", userId],
    queryFn: ({ pageParam }) =>
      KyInstance.get(
        `/api/users/${userId}/posts`,
        pageParam ? { searchParams: { cursor: pageParam } } : {},
      ).json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  if (status === "pending") return <PostsLoadingSkeleton />;
  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        This user hasn&apos;t posted anything yet.
      </p>
    );
  }
  if (status === "error")
    return (
      <p className="text-center text-destructive">
        An error occurred while loading posts
      </p>
    );
  return (
    <InfiniteScrollContainer
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
      className="space-y-5"
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <PostLoadingSkeleton />}
    </InfiniteScrollContainer>
  );
}
