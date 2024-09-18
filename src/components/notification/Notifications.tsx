"use client";

import { NotificationsPage, PostsPage } from "@/types/prisma.types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import KyInstance from "@/lib/ky";
import PostsLoadingSkeleton, {
  PostLoadingSkeleton,
} from "@/components/posts/PostsLoadingSkeleton";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Notification from "./Notification";
import { useEffect } from "react";

export default function Notifications() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ["notificatios"],
    queryFn: ({ pageParam }) =>
      KyInstance.get(
        "/api/notifications",
        pageParam ? { searchParams: { cursor: pageParam } } : {},
      ).json<NotificationsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  // console.log("error ", error);

  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: () => KyInstance.patch("/api/notifications/mark-as-read"),
    onSuccess: () => {
      queryClient.setQueryData(["unread-notifications-count"], {
        unreadCount: 0,
      });
    },
    onError(error) {
      console.error("Faild to mark notifications as read", error);
    },
  });
  useEffect(() => {
    mutate();
  }, [mutate]);
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  if (status === "pending") return <PostsLoadingSkeleton />;
  if (status === "success" && !notifications.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        You don&apos;t have any notifications yet.
      </p>
    );
  }
  if (status === "error")
    return (
      <p className="text-center text-destructive">
        An error occurred while loading notifications.
      </p>
    );
  return (
    <InfiniteScrollContainer
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
      className="space-y-5"
    >
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} />
      ))}
      {isFetchingNextPage && <PostLoadingSkeleton />}
    </InfiniteScrollContainer>
  );
}
