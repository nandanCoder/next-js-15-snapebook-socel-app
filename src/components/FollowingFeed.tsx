"use client";

import { PostsPage } from "@/types/prisma.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Post from "@/components/posts/Post";
import KyInstance from "@/lib/ky";
import InfiniteScrollContainer from "./InfiniteScrollContainer";
import PostsLoadingSkeleton, {
  PostLoadingSkeleton,
} from "./posts/PostsLoadingSkeleton";
import DeletePostDialog from "./posts/DeletePostDialog";

export default function FollowingFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "following"],
    queryFn: ({ pageParam }) =>
      KyInstance.get(
        "/api/post/following",
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
        No Post found. Start following people to see their posts here.
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
