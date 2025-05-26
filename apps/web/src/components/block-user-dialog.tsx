import { DialogContent } from "@radix-ui/react-dialog";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle
} from "@/components/dialog";

import { Button } from "./button";

export function BlockUserDialog({
  user_id,
  user_name,
  open,
  onClose
}: {
  user_id: string;
  user_name: string;
  open: boolean;
  onClose: () => void;
}) {
  async function blockUser() {
    const block = await fetch(`/api/user/block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ target_id: user_id })
    });

    if (!block.ok) {
      const data = await block.json();

      if (data.error && data.error === "already_blocked") {
        toast.error("You have already blocked this user.");
        return;
      }

      toast.error(data.msg || "Failed to block user.");
      return;
    }

    onClose();
    toast.success(`@${user_name} has been blocked.`);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="bg-background fixed left-1/2 top-1/2 z-[9999999] -translate-x-1/2 -translate-y-1/2 border border-gray-200 p-6 opacity-100 max-sm:min-w-[90%]">
        <DialogHeader>
          <DialogTitle>Block User</DialogTitle>
          <DialogDescription>
            Are you sure you want to block <strong>{user_name}</strong>?<br />
            <i>(you can later unblock them from your settings)</i>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 max-sm:gap-4 max-sm:pt-8">
          <DialogClose asChild>
            <Button className="border-0 px-4 py-1 max-sm:py-2">Cancel</Button>
          </DialogClose>

          <Button
            onClick={blockUser}
            className="border-0 bg-red-500 px-4 py-1 text-white hover:bg-red-500/80 max-sm:py-2"
          >
            Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
