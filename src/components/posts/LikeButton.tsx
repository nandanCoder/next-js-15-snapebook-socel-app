import kyInstance from "@/lib/ky";
import { cn } from "@/lib/utils";
import { LikeInfo } from "@/types/prisma.types";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
interface LikeButtonProps {
  postId: string;
  initialState: LikeInfo;
}

export default function LikeButton({ postId, initialState }: LikeButtonProps) {
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["like-info", postId];
  const { data } = useQuery({
    queryKey,
    queryFn: () => kyInstance.get(`/api/post/${postId}/likes`).json<LikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });
  const { mutate } = useMutation({
    mutationFn: () =>
      data.isLikedByUser
        ? kyInstance.delete(`/api/post/${postId}/likes`)
        : kyInstance.post(`/api/post/${postId}/likes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<LikeInfo>(queryKey);
      queryClient.setQueryData<LikeInfo>(queryKey, () => ({
        likes:
          (previousState?.likes || 0) + (previousState?.isLikedByUser ? -1 : 1),
        isLikedByUser: !previousState?.isLikedByUser,
      }));
      return { previousState };
    },

    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast.error("Failed to like this post. Please try again.");
    },
  });
  return (
    <button onClick={() => mutate()} className="flex items-center gap-2">
      <Heart
        className={cn(
          "size-5",
          data.isLikedByUser &&
            "fill-red-500 text-red-500 transition-colors duration-100",
        )}
      />
      <span className="text-sm font-medium tabular-nums">
        {data.likes} <span className="hidden sm:inline">likes</span>
      </span>
    </button>
  );
}
