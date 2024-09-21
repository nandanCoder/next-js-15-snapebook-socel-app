import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { PushSubscription } from "web-push";
export async function POST(req: Request) {
  try {
    const newSubscription: PushSubscription | undefined = await req.json();
    if (!newSubscription) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }
    console.log("Recieved new subscription", newSubscription);
    const { user: loggedInUser } = await validateRequest();
    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: loggedInUser.id,
      },
      include: {
        subscriptions: true,
      },
    });
    if (!user) {
      return Response.json(
        { error: "User not found" },
        {
          status: 404,
        },
      );
    }
    const existingSubscription = user.subscriptions.find(
      (sub) => sub.endpoint === newSubscription.endpoint,
    );
    if (existingSubscription) {
      return Response.json(
        { message: "Subscription already exists" },
        {
          status: 200,
        },
      );
    }
    await prisma.subscription.create({
      data: {
        endpoint: newSubscription.endpoint,
        p256dh: newSubscription.keys.p256dh,
        auth: newSubscription.keys.auth,
        user: {
          connect: { id: user.id },
        },
      },
    });

    return Response.json(
      { message: "Subscription added successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const subscriptionToDelete: PushSubscription | undefined = await req.json();
    if (!subscriptionToDelete) {
      return new Response(
        JSON.stringify({ error: "Invalid subscription subscriptionToDelete" }),
        { status: 400 },
      );
    }
    console.log(
      "Received request to delete subscription",
      subscriptionToDelete,
    );

    const { user: loggedInUser } = await validateRequest();
    if (!loggedInUser) {
      return Response.json(
        { error: "Unauthorized" },
        {
          status: 401,
        },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: loggedInUser.id,
      },
      include: {
        subscriptions: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        {
          status: 404,
        },
      );
    }

    const subscription = user.subscriptions.find(
      (sub) => sub.endpoint === subscriptionToDelete.endpoint,
    );

    if (!subscription) {
      return Response.json(
        { error: "Subscription not found" },
        {
          status: 404,
        },
      );
    }

    await prisma.subscription.delete({
      where: {
        id: subscription.id,
      },
    });

    return Response.json(
      { message: "Subscription deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Internal server error" },
      {
        status: 500,
      },
    );
  }
}
