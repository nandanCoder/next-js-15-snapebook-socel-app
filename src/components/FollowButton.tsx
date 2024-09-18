"use client";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/types/prisma.types";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Button } from "./ui/button";
import kyInstance from "@/lib/ky";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowButton({
  userId,
  initialState,
}: FollowButtonProps) {
  const queryClient = useQueryClient();
  const { data } = useFollowerInfo(userId, initialState);
  const queryKey: QueryKey = ["follower-info", userId];
  const { mutate } = useMutation({
    mutationFn: () =>
      data.isFollowedByUser
        ? kyInstance.delete(`/api/users/${userId}/followers`)
        : kyInstance.post(`/api/users/${userId}/followers`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<FollowerInfo>(queryKey);
      queryClient.setQueryData<FollowerInfo>(queryKey, () => ({
        followers:
          (previousState?.followers || 0) +
          (previousState?.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState?.isFollowedByUser,
      }));
      return { previousState };
    },

    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast.error("Failed to follow. Please try again.");
    },
  });
  return (
    <Button
      onClick={() => mutate()}
      variant={data.isFollowedByUser ? "secondary" : "default"}
    >
      {data.isFollowedByUser ? "Unfollow" : "Follow"}
    </Button>
  );
}
