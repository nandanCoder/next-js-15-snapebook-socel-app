import { Skeleton } from "../ui/skeleton";

export default function CommentsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <CommentLoadingSkeleton />
      <CommentLoadingSkeleton />
    </div>
  );
}
function CommentLoadingSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 py-3">
      <span className="hidden sm:inline">
        <Skeleton className="size-12 rounded-full" />
      </span>
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-1 text-sm">
          <Skeleton className="h-6 w-20 rounded-2xl" />
        </div>
        <div className="w-full">
          <Skeleton className="h-12 w-auto rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
