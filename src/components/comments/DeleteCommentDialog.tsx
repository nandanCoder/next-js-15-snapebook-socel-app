import { useDeleteCommentMutation } from "@/lib/mutations";
import { CommentData } from "@/types/prisma.types";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "../ui/credenza";

interface DeleteCommentDialogProps {
  comment: CommentData;
  open: boolean;
  onClose: () => void;
}
export default function DeleteCommentDialog({
  comment,
  onClose,
  open,
}: DeleteCommentDialogProps) {
  const mutation = useDeleteCommentMutation();

  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) {
      onClose();
    }
  }
  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Delete comment ?</CredenzaTitle>
          <CredenzaDescription>
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
          <LoadingButton
            variant="destructive"
            onClick={() =>
              mutation.mutate(comment.id, {
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
