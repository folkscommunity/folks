import * as React from "react";
import { ChangeEvent, useCallback } from "react";
import {
  Image as ImageIcon,
  Spinner,
  UploadSimple
} from "@phosphor-icons/react";

import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib";
import { useDropZone, useFileUpload, useUploader } from "./image-upload-hooks";

export const ImageUploader = ({
  onUpload
}: {
  onUpload: (url: string) => void;
}) => {
  const { loading, uploadFile } = useUploader({ onUpload });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    uploader: uploadFile
  });

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      e.target.files ? uploadFile(e.target.files[0]) : null,
    [uploadFile]
  );

  if (loading) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center rounded-lg bg-opacity-80 p-8 text-xl">
        {/* @ts-ignore */}
        <Spinner className="animate-spin text-slate-500" />
      </div>
    );
  }

  const wrapperClass = cn(
    "flex flex-col items-center justify-center px-8 py-10 rounded-lg bg-opacity-80",
    draggedInside && "bg-neutral-100"
  );

  return (
    <div
      className={wrapperClass}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
    >
      {/* @ts-ignore */}
      <ImageIcon
        size={48}
        className="mb-4 text-black opacity-20 dark:text-white"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-center text-sm font-medium text-neutral-400 dark:text-neutral-500">
          {draggedInside ? "Drop image here" : "Drag and drop or"}
        </div>
        <div>
          <Button disabled={draggedInside} onClick={handleUploadClick}>
            {/* @ts-ignore */}
            <UploadSimple />
            Upload an image
          </Button>
        </div>
      </div>
      <input
        className="h-0 w-0 overflow-hidden opacity-0"
        ref={ref}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        onChange={onFileChange}
      />
    </div>
  );
};
