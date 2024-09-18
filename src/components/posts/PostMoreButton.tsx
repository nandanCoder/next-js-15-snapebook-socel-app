import { PostData } from "@/types/prisma.types";
import { useState } from "react";
import DeletePostDialog from "./DeletePostDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Trash } from "lucide-react";

interface PostMoreButtonProps {
  post: PostData;
  className?: string;
}

export default function PostMoreButton({
  post,
  className,
}: PostMoreButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <span className="flex items-center gap-3 text-destructive">
              <Trash className="size-4" />
              Delete
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePostDialog
        onClose={() => setShowDeleteDialog(false)}
        open={showDeleteDialog}
        post={post}
      />
    </>
  );
}
