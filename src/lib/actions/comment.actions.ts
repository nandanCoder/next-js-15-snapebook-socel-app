"use server";

import { validateRequest } from "@/auth";
import { getCommentDataInclude, PostData } from "@/types/prisma.types";
import { createCommentSchema } from "../validations";
import prisma from "../prisma";

export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const { content: contentValidated } = createCommentSchema.parse({ content });
  const [newComment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content: contentValidated,
        postId: post.id,
        userId: user.id,
      },
      include: getCommentDataInclude(user.id),
    }),
    ...(post.userId !== user.id
      ? [
          prisma.notification.create({
            data: {
              issuerId: user.id,
              recipientId: post.userId,
              type: "COMMENT",
            },
          }),
        ]
      : []),
  ]);
  return newComment;
}

export async function deleteComment(id: string) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({
    where: {
      id,
    },
  });
  if (!comment) throw new Error("Comment not found.");
  if (comment.userId !== user.id) throw new Error("Unauthorized");
  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });
  return deletedComment;
}
