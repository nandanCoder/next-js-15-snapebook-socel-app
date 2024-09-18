import kyInstance from "@/lib/ky";
import { cn } from "@/lib/utils";
import { BookmarkInfo } from "@/types/prisma.types";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark, BookMarked, Heart } from "lucide-react";
import { toast } from "sonner";
interface BookmarkButtonProps {
  postId: string;
  initialState: BookmarkInfo;
}

export default function BookmarkButton({
  postId,
  initialState,
}: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["bookmark-info", postId];
  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/post/${postId}/bookmark`).json<BookmarkInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });
  const { mutate } = useMutation({
    mutationFn: () =>
      data.isBookmarkedByUser
        ? kyInstance.delete(`/api/post/${postId}/bookmark`)
        : kyInstance.post(`/api/post/${postId}/bookmark`),
    onMutate: async () => {
      toast.success(`Post ${data.isBookmarkedByUser ? "un" : ""}bookmarked`);
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<BookmarkInfo>(queryKey);
      queryClient.setQueryData<BookmarkInfo>(queryKey, () => ({
        isBookmarkedByUser: !previousState?.isBookmarkedByUser,
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
      <Bookmark
        className={cn(
          "size-5",
          data.isBookmarkedByUser &&
            "fill-primary text-primary transition-colors duration-100",
        )}
      />
    </button>
  );
}
