import {
  InfiniteData,
  QueryFilters,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deletePost, submitPost } from "./actions/post.actions";
import { toast } from "sonner";
import { CommentData, CommentsPage, PostsPage } from "@/types/prisma.types";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/app/(root)/SessionProvider";
import { useUploadThing } from "./uploadthing";
import { UpdateUserProfileValues } from "./validations";
import { updateUserProfile } from "./actions/user.actions";
import { deleteComment, submitComment } from "./actions/comment.actions";

export function useSubmitPostMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      const queryFilter = {
        queryKey: ["post-feed"],
        predicate(query) {
          return (
            query.queryKey.includes("post-feed") ||
            (query.queryKey.includes("user-posts") &&
              query.queryKey.includes(user.id))
          );
        },
      } satisfies QueryFilters;
      // cansil all the running queris
      await queryClient.cancelQueries(queryFilter);
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          const firstPage = oldData?.pages[0];
          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        },
      );
      // some time whan user create a post with out loading the fast page
      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        predicate: (query) => {
          return queryFilter.predicate(query) && !query.state.data;
        },
      });
      toast.success("Posted successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to post. Please try again.");
    },
  });
  return mutation;
}

export function useDeletePostMutation() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async (deletedPost) => {
      const queryFilter: QueryFilters = { queryKey: ["post-feed"] };
      await queryClient.cancelQueries(queryFilter);
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.filter((p) => p.id !== deletedPost.id),
            })),
          };
        },
      );
      toast.success("Post deleted successfully");
      if (pathname === `/posts/${deletedPost.id}`) {
        router.push(`/users/${deletedPost.user.username}`);
      }
    },
    onError(error) {
      console.error(error);
      toast.error("Failed to delete post. Please try again.");
    },
  });

  return mutation;
}

export function useUpdateProfileMutation() {
  const router = useRouter();

  const queryClient = useQueryClient();

  const { startUpload: startAvatarUpload } = useUploadThing("avatar");

  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateUserProfileValues;
      avatar?: File;
    }) => {
      return Promise.all([
        updateUserProfile(values),
        avatar && startAvatarUpload([avatar]),
      ]);
    },
    onSuccess: async ([updatedUser, uploadResult]) => {
      const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl;

      const queryFilter: QueryFilters = {
        queryKey: ["post-feed"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === updatedUser.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                      avatarUrl: newAvatarUrl || updatedUser.avatarUrl,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );
      router.refresh();
      toast.success("Profile updated successfully");
    },
    onError(error) {
      console.error(error);
      toast.error("Failed to update profile. Please try again.");
    },
  });

  return mutation;
}
// for comments
export function useSubmitCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: submitComment,
    onSuccess: async (newComment) => {
      const queryKey: QueryKey = ["comments", postId];
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          const firstPage = oldData?.pages[0];

          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  previousCursor: firstPage.previousCursor,
                  comments: [...firstPage.comments, newComment],
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        },
      );
      queryClient.invalidateQueries({
        queryKey,
        predicate(query) {
          return !query.state.data;
        },
      });
      toast("Comment created");
    },
    onError(error) {
      console.error(error);
      toast.error("Failed to submit comment. Please try again.");
    },
  });
  return mutation;
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async (deletedComment) => {
      const queryKey: QueryKey = ["comments", deletedComment.postId];

      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              previousCursor: page.previousCursor,
              comments: page.comments.filter((c) => c.id !== deletedComment.id),
            })),
          };
        },
      );

      toast("Comment deleted");
    },
    onError(error) {
      console.error(error);
      toast.error("Failed to delete comment. Please try again.");
    },
  });

  return mutation;
}
