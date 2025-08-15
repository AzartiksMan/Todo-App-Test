import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { createList } from "@/lib/firestore";

export const AddListBar = () => {
  const [newListTitle, setNewListTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleAddList() {
    const userFromAuth = auth.currentUser;
    if (!userFromAuth?.uid || !userFromAuth.email) {
      return toast.error("Not authenticated");
    }

    const title = newListTitle.trim();
    if (!title) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createList(userFromAuth.uid, userFromAuth.email, title);
      setNewListTitle("");
      toast.success("List created");
    } catch {
      toast.error("Create failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-6 flex gap-2">
      <Input
        placeholder="New list title"
        value={newListTitle}
        onChange={(event) => setNewListTitle(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleAddList()}
        disabled={isSubmitting}
      />
      <Button
        onClick={handleAddList}
        disabled={isSubmitting || !newListTitle.trim()}
      >
        Add
      </Button>
    </div>
  );
};
