"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { UserData } from "@/types/prisma.types";
import EditProfileDialog from "./EditProfileDialog";
interface EditProfileButtonProps {
  user: UserData;
}

export default function EditProfileButton({ user }: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState<boolean>(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        Edit Profile
      </Button>
      <EditProfileDialog
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
