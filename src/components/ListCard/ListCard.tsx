"use client";

import { useEffect, useState } from "react";
import { renameList, deleteListWithTasks, type ListDoc } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Trash2, ListTodo, Users } from "lucide-react";
import { ListTasksPanel } from "../ListTasksPanel";
import { MembersPanel } from "../MembersPanel";

export function ListCard({ list }: { list: ListDoc }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(list.title);
  const [isBusy, setIsBusy] = useState(false);

  const [isTasksVisible, setIsTasksVisible] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  useEffect(() => {
    setTitleInput(list.title);
  }, [list.title]);

  const currentUserEmail = (auth.currentUser?.email ?? "").trim().toLowerCase();
  const myRole = list.members?.[currentUserEmail];
  const isOwner = list.ownerEmail === currentUserEmail;
  const canAdmin = isOwner || myRole === "admin";

  async function handleSaveTitle() {
    if (isBusy) {
      return;
    }
    const nextTitle = titleInput.trim();
    if (!nextTitle || nextTitle === list.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsBusy(true);
    try {
      await renameList(list.id, nextTitle);
      toast.success("List renamed");
      setIsEditingTitle(false);
    } catch {
      toast.error("Rename failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteList() {
    if (isBusy) {
      return;
    }
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    setIsBusy(true);
    try {
      await deleteListWithTasks(list.id);
      toast.success("List deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsBusy(false);
    }
  }

  function toggleTasks() {
    setIsTasksVisible((prev) => !prev);
    if (isMembersVisible) {
      setIsMembersVisible(false);
    }
  }

  function toggleMembers() {
    setIsMembersVisible((prev) => !prev);
    if (isTasksVisible) {
      setIsTasksVisible(false);
    }
  }

  const HeaderView = (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-lg font-medium">{list.title}</h3>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant={isTasksVisible ? "default" : "ghost"}
          aria-label="Toggle tasks"
          onClick={toggleTasks}
        >
          <ListTodo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={isMembersVisible ? "default" : "ghost"}
          aria-label="Toggle members"
          onClick={toggleMembers}
        >
          <Users className="h-4 w-4" />
        </Button>
        {canAdmin && (
          <>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Edit list"
              onClick={() => setIsEditingTitle(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete list"
              onClick={handleDeleteList}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const HeaderEdit = (
    <div className="flex gap-2">
      <Input
        value={titleInput}
        onChange={(event) => setTitleInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSaveTitle();
          }
          if (event.key === "Escape") {
            setTitleInput(list.title);
            setIsEditingTitle(false);
          }
        }}
        disabled={isBusy}
      />
      <Button size="sm" onClick={handleSaveTitle} disabled={isBusy}>
        Save
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setTitleInput(list.title);
          setIsEditingTitle(false);
        }}
        disabled={isBusy}
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {isEditingTitle ? HeaderEdit : HeaderView}

      {isTasksVisible && (
        <ListTasksPanel listId={list.id} canAdmin={canAdmin} />
      )}

      {isMembersVisible && (
        <MembersPanel
          listId={list.id}
          ownerEmail={list.ownerEmail}
          members={list.members ?? {}}
          canAdmin={canAdmin}
        />
      )}
    </div>
  );
}
