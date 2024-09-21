import { useEffect } from "react";
import { useChatContext } from "stream-chat-react";

export default function PushMessageListener() {
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      console.log("Received push message", event.data);
      const channelId = event.data.channelId;
      if (channelId) {
        client
          .queryChannels({ id: channelId })
          .then((channels) => {
            setActiveChannel(channels[0]);
          })
          .catch((error) =>
            console.error(
              "PushMessageListener: A channel with this id does not exist",
              error,
            ),
          );
      }
    };

    navigator.serviceWorker.addEventListener("message", messageListener);
    return () =>
      navigator.serviceWorker.removeEventListener("message", messageListener);
  }, [client, setActiveChannel]);

  return null;
}
