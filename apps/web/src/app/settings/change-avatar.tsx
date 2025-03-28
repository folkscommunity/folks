"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import {
  FileAmountLimitValidator,
  FileSizeValidator,
  FileTypeValidator,
  ImageDimensionsValidator
} from "use-file-picker/validators";

import { FolksAvatar } from "@/components/folks-avatar";

export function ChangeAvatar({ user }: { user: any }) {
  const [avatar, setAvatar] = useState(user.avatar_url);

  const { openFilePicker, filesContent, loading, errors, clear } =
    useFilePicker({
      readAs: "ArrayBuffer",
      accept: "image/*",
      multiple: false,
      validators: [
        new FileAmountLimitValidator({ max: 1 }),
        new FileTypeValidator(["jpg", "jpeg", "png", "webp"]),
        new FileSizeValidator({ maxFileSize: 15 * 1024 * 1024 /* 15 MB */ }),
        new ImageDimensionsValidator({
          maxWidth: 8000,
          maxHeight: 8000
        })
      ],
      onFilesRejected: (rejectedFiles: any) => {
        const reason = rejectedFiles?.errors[0]?.reason;

        if (reason === "FILE_TYPE_NOT_ACCEPTED") {
          toast.error("Invalid file type.");
        } else if (reason === "FILE_SIZE_TOO_LARGE") {
          toast.error("File size exceeds limit.");
        } else if (reason === "MAX_AMOUNT_OF_FILES_EXCEEDED") {
          toast.error("You can upload only a single image.");
        } else if (
          reason === "IMAGE_HEIGHT_TOO_BIG" ||
          reason === "IMAGE_WIDTH_TOO_BIG"
        ) {
          toast.error("Image dimensions exceeds limit. (8000x8000 max)");
        } else {
          toast.error("Invalid file type or size.");
        }
      }
    });

  function uploadAvatars(files: any[]) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("avatar", new Blob([file.content]), file.name);
    });

    fetch("/api/user/avatar", {
      method: "POST",
      body: formData
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          const base64String = `data:${files[0].type};base64,${Buffer.from(files[0].content, "binary").toString("base64")}`;
          setAvatar(base64String);

          toast.success(`Avatar changed successfully.`);
        } else {
          toast.error(res.message || "Something went wrong.");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Something went wrong.");
      });
  }

  useEffect(() => {
    if (filesContent.length > 0) {
      uploadAvatars(filesContent);
      clear();
    }
  }, [filesContent, clear]);

  return (
    <div
      onClick={() => openFilePicker()}
      className="group my-4 size-[80px] cursor-pointer rounded-full"
      title="Click to change your avatar."
    >
      <FolksAvatar src={avatar} name={user.username} size={80} />

      <div className="bg-black-900/70 absolute mt-[-80px] flex size-[80px] items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="text-center font-bold leading-[16px] text-white">
          Change Avatar
        </span>
      </div>
    </div>
  );
}
