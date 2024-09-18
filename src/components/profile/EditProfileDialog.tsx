import { UserData } from "@/types/prisma.types";
import React, { useRef, useState } from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "../ui/credenza";
import { useForm } from "react-hook-form";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateProfileMutation } from "@/lib/mutations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import LoadingButton from "../LoadingButton";
import Image, { StaticImageData } from "next/image";
import { Label } from "../ui/label";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { Camera } from "lucide-react";
import CropImageDialog from "../CropImageDialog";
import Resizer from "react-image-file-resizer";
interface EditProfileDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || "",
    },
  });
  const mutation = useUpdateProfileMutation();
  const [croppedAvater, setCroppedAvater] = useState<Blob | null>(null);

  function onSubmit(values: UpdateUserProfileValues) {
    // submit the form data
    const newAvatarFile = croppedAvater
      ? new File([croppedAvater], `avatar_${user.id}.webp`)
      : undefined;
    mutation.mutate(
      {
        values,
        avatar: newAvatarFile,
      },
      {
        onSuccess: () => {
          setCroppedAvater(null);
          onOpenChange(false);
        },
      },
    );
  }
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="px-4 md:p-6">
        <CredenzaHeader>
          <CredenzaTitle>Edit Profile</CredenzaTitle>
        </CredenzaHeader>
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <AvaterInput
            src={
              croppedAvater
                ? URL.createObjectURL(croppedAvater)
                : user.avatarUrl || avatarPlaceholder
            }
            onImageCroped={setCroppedAvater}
          />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name.." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Tall us a little bit about yourself.."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CredenzaFooter>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}

interface AvaterInputProps {
  src: string | StaticImageData;
  onImageCroped: (blob: Blob | null) => void;
}

function AvaterInput({ src, onImageCroped }: AvaterInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  function onImageSelected(image: File | undefined) {
    if (!image) return;
    Resizer.imageFileResizer(
      image,
      1024,
      1024,
      "WEBP",
      100,
      0,
      (uri) => {
        setImageToCrop(uri as File);
      },
      "file",
    );
  }
  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block"
      >
        <Image
          src={src}
          alt="Avatar Preview"
          width={150}
          height={150}
          className="size-32 flex-none rounded-full object-cover"
        />
        <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-black bg-opacity-30 transition-colors duration-200 group-hover:bg-opacity-20">
          <Camera size={24} />
        </span>
      </button>
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={1}
          onCropped={onImageCroped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
    </>
  );
}
