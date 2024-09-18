import { useDeletePostMutation } from "@/lib/mutations";
import { PostData } from "@/types/prisma.types";
import { useMutation } from "@tanstack/react-query";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "../ui/credenza";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";

interface DeletePostDialogProps {
  post: PostData;
  open: boolean;
  onClose: () => void;
}

export default function DeletePostDialog({
  post,
  onClose,
  open,
}: DeletePostDialogProps) {
  const mutation = useDeletePostMutation();
  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) {
      onClose();
    }
  }

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>DeletePost?</CredenzaTitle>
          <CredenzaDescription>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
          <LoadingButton
            variant="destructive"
            onClick={() =>
              mutation.mutate(post.id, {
                onSuccess: onClose,
              })
            }
            loading={mutation.isPending}
          >
            Delete
          </LoadingButton>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
