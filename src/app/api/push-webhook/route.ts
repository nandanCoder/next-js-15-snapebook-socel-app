import prisma from "@/lib/prisma";
import { StreamPushEvent } from "@/types/stream.types";
import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import webPush, { WebPushError } from "web-push";
export async function POST(req: Request) {
  try {
    const streamClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_KEY!,
      process.env.STREAM_SECRET,
    );
    const rawBody = await req.text();
    const validRequest = streamClient.verifyWebhook(
      rawBody,
      req.headers.get("x-signature") || "",
    );
    if (!validRequest) {
      return NextResponse.json(
        { error: "Webhook signature invalid" },
        { status: 401 },
      );
    }
    const event: StreamPushEvent = await JSON.parse(rawBody);
    console.log("Push webhook event received", JSON.stringify(event));

    const sender = event.user;
    const recipientIds = event.channel.members
      .map((member) => member.user_id)
      .filter((id) => id !== sender.id);
    const channelId = event.channel.id;
    const recipients = await prisma.user.findMany({
      where: {
        id: {
          in: recipientIds,
        },
      },
      include: {
        subscriptions: true,
      },
    });
    const pushPromises = recipients
      .map((recipient) => {
        const subscriptions = recipient.subscriptions || [];
        return subscriptions.map((sub) =>
          webPush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              JSON.stringify({
                title: `New message from ${sender.name}`,
                body: event.message.text,
                icon: sender.image,
                image:
                  event.message.attachments[0]?.image_url ||
                  event.message.attachments[0]?.thumb_url,
                channelId,
              }),
              {
                vapidDetails: {
                  subject: `mailto:nandan3214m@gmail.com`,
                  publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_KEY!,
                  privateKey: process.env.WEB_PUSH_PRIVATE_KEY!,
                },
              },
            )
            .catch((error) => {
              console.error("Error sending push notification", error);
              if (error instanceof WebPushError && error.statusCode === 410) {
                console.log("push subscription expired, deleteing...");
                return prisma.subscription.delete({
                  where: {
                    id: sub.id,
                  },
                });
              }
            }),
        );
      })
      .flat();
    await Promise.all(pushPromises);
    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
