import { useSubmitCommentMutation } from "@/lib/mutations";
import { PostData } from "@/types/prisma.types";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, SendHorizonal } from "lucide-react";

interface CommentInputProps {
  post: PostData;
}

export default function CommentInput({ post }: CommentInputProps) {
  const [input, setInput] = useState<string>("");
  const mutation = useSubmitCommentMutation(post.id);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;
    mutation.mutate(
      {
        post,
        content: input,
      },
      {
        onSuccess: () => setInput(""),
      },
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        placeholder="Write a comment..."
      />
      <Button
        variant="ghost"
        type="submit"
        size="icon"
        disabled={!input.trim() || mutation.isPending}
      >
        {!mutation.isPending ? (
          <SendHorizonal />
        ) : (
          <Loader2 className="animate-spin" />
        )}
      </Button>
    </form>
  );
}
