import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import React, { ChangeEvent, FormEvent, use, useState } from "react";
import { DefaultStreamChatGenerics, useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";
import useDebounce from "@/hookes/useDebounce";
import { UserResponse } from "stream-chat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, Pencil, SearchIcon, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onChatCreated,
  onOpenChange,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();
  const { user: loggedInUser } = useSession();
  const [searchInput, setSearchInput] = useState<string>("");
  const searchInputDebounced = useDebounce(searchInput, 350);
  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<DefaultStreamChatGenerics>[]
  >([]);
  const [nameInputValue, setNameInputValue] = useState<string>("");
  console.log("name input", nameInputValue);
  const [isGroupNameDialogOpen, setGroupNameDialogOpen] =
    useState<boolean>(false);
  const { data, isFetching, isError, isSuccess } = useQuery({
    queryKey: ["stream-users", searchInputDebounced],
    queryFn: async () =>
      client.queryUsers(
        {
          id: { $ne: loggedInUser.id },
          role: { $ne: "admin" },
          ...(searchInputDebounced
            ? {
                $or: [
                  {
                    name: { $autocomplete: searchInputDebounced },
                  },
                  {
                    username: { $autocomplete: searchInputDebounced },
                  },
                ],
              }
            : {}),
        },
        { name: 1, username: 1 },
        { limit: 15 },
      ),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const channel = client.channel("messaging", {
        members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)],
        name:
          nameInputValue ||
          (selectedUsers.length > 1
            ? loggedInUser.displayName +
              ", " +
              selectedUsers.map((u) => u.name).join(", ")
            : undefined),
      });
      await channel.create();
      return channel;
    },
    onSuccess: (channel) => {
      setActiveChannel(channel), onChatCreated();
    },
    onError: (error) => {
      console.log("Error starting chat", error);
      toast.error("Error starting chat. Please try again.");
    },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New chat</DialogTitle>
        </DialogHeader>
        <div>
          <div className="group relative">
            <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="Search users..."
              className="h-12 w-full pe-4 ps-14 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {!!selectedUsers.length && (
            <div className="mt-4 flex flex-wrap gap-2 p-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}
          <hr />
          <div className="h-96 overflow-y-auto">
            {isSuccess &&
              data.users.map((user) => (
                <UserResult
                  key={user.id}
                  user={user}
                  selected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={() => {
                    setSelectedUsers((prev) =>
                      prev.some((u) => u.id === user.id)
                        ? prev.filter((u) => u.id !== user.id)
                        : [...prev, user],
                    );
                  }}
                />
              ))}
            {isSuccess && !data.users.length && (
              <p className="my-3 text-center text-muted-foreground">
                No user found. Try a different name.
              </p>
            )}
            {isFetching && <Loader2 className="mx-auto my-3 animate-spin" />}
            {isError && (
              <p className="my-3 text-center text-destructive">
                An error occurred while loading users.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-4 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setGroupNameDialogOpen(true)}
            asChild
          >
            Enter group name
            <Pencil />
          </Button>
          <LoadingButton
            disabled={!selectedUsers.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <SelectChannelNameDialog
              open={isGroupNameDialogOpen}
              onClose={() => setGroupNameDialogOpen(false)}
              value={nameInputValue}
              onChange={(e) => setNameInputValue(e.target.value)}
            />
            Start chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserResultProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ onClick, selected, user }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.image} />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {selected && <Check className="size-5 text-green-500" />}
    </button>
  );
}

interface SelectedUserTagProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  onRemove: () => void;
}
function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar avatarUrl={user.image} size={24} />
      <p className="font-bold">{user.name}</p>
      <X className="mx-2 size-5 text-muted-foreground" />
    </button>
  );
}

interface SelectChannelNameDialogProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}
function SelectChannelNameDialog({
  open,
  onClose,
  value,
  onChange,
  onSubmit,
}: SelectChannelNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Enter Group Name</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <Input
            type="text"
            autoFocus
            placeholder="Group name.."
            value={value}
            onChange={onChange}
            className="h-12 w-full px-4"
          />
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button
            disabled={!value || value.length <= 3}
            onClick={onClose}
            type="button"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
