"use client";

import { PostsPage } from "@/types/prisma.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Post from "@/components/posts/Post";
import KyInstance from "@/lib/ky";
import PostsLoadingSkeleton, {
  PostLoadingSkeleton,
} from "@/components/posts/PostsLoadingSkeleton";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "search", query],
    queryFn: ({ pageParam }) =>
      KyInstance.get("/api/search/", {
        searchParams: {
          q: query,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }).json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0, // all time cash cliear
  });
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  if (status === "pending") return <PostsLoadingSkeleton />;
  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        No posts found for this query.
      </p>
    );
  }
  if (status === "error")
    return (
      <p className="text-center text-destructive">
        An error occurred while loading posts.
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
