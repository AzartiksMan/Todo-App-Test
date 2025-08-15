"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  addTask,
  deleteTask,
  toggleTask,
  updateTask,
  watchTasks,
  type TaskDoc,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { Pencil, Trash2 } from "lucide-react";

interface ListTasksPanelProps {
  listId: string;
  canAdmin: boolean;
}

export const ListTasksPanel: React.FC<ListTasksPanelProps> = ({
  listId,
  canAdmin,
}) => {
  const [tasks, setTasks] = useState<TaskDoc[]>([]);

  const [taskTitleInput, setTaskTitleInput] = useState<string>("");
  const [taskDescriptionInput, setTaskDescriptionInput] = useState<string>("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitleInput, setEditingTitleInput] = useState<string>("");
  const [editingDescriptionInput, setEditingDescriptionInput] =
    useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = watchTasks(listId, setTasks);
    return () => {
      unsubscribe();
    };
  }, [listId]);

  async function handleAddTask() {
    if (isSubmitting) {
      return;
    }
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }

    const user = auth.currentUser;
    if (!user?.uid) {
      toast.error("Not authenticated");
      return;
    }

    const title = taskTitleInput.trim();
    const description = taskDescriptionInput.trim();

    if (!title) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask(listId, {
        title,
        description,
        createdBy: user.uid,
      });
      setTaskTitleInput("");
      setTaskDescriptionInput("");
      toast.success("Task added");
    } catch {
      toast.error("Add task failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartEditTask(task: TaskDoc) {
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    setEditingTaskId(task.id);
    setEditingTitleInput(task.title);
    setEditingDescriptionInput(task.description ?? "");
  }

  function handleCancelEditTask() {
    setEditingTaskId(null);
    setEditingTitleInput("");
    setEditingDescriptionInput("");
  }

  async function handleSaveEditTask() {
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    if (!editingTaskId) {
      return;
    }

    const nextTitle = editingTitleInput.trim();
    const nextDescription = editingDescriptionInput.trim();

    if (!nextTitle) {
      toast.error("Title is required");
      return;
    }

    try {
      await updateTask(listId, editingTaskId, {
        title: nextTitle,
        description: nextDescription,
      });
      toast.success("Task updated");
      handleCancelEditTask();
    } catch {
      toast.error("Update failed");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    try {
      await deleteTask(listId, taskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function handleToggleTask(task: TaskDoc) {
    try {
      await toggleTask(listId, task.id, !task.completed);
    } catch {
      toast.error("Not allowed");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {canAdmin && (
        <div className="space-y-2 rounded border p-3">
          <Input
            placeholder="Task title"
            value={taskTitleInput}
            onChange={(event) => setTaskTitleInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTask();
              }
            }}
            disabled={isSubmitting}
          />
          <Input
            placeholder="Description (optional)"
            value={taskDescriptionInput}
            onChange={(event) => setTaskDescriptionInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTask();
              }
            }}
            disabled={isSubmitting}
          />
          <Button
            onClick={handleAddTask}
            disabled={isSubmitting || !taskTitleInput.trim()}
          >
            Add task
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start justify-between rounded border p-3"
          >
            {editingTaskId === task.id ? (
              <div className="flex w-full flex-col gap-2">
                <Input
                  value={editingTitleInput}
                  onChange={(event) => setEditingTitleInput(event.target.value)}
                  placeholder="Title"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSaveEditTask();
                    }
                    if (event.key === "Escape") {
                      handleCancelEditTask();
                    }
                  }}
                />
                <Input
                  value={editingDescriptionInput}
                  onChange={(event) =>
                    setEditingDescriptionInput(event.target.value)
                  }
                  placeholder="Description (optional)"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSaveEditTask();
                    }
                    if (event.key === "Escape") {
                      handleCancelEditTask();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEditTask}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCancelEditTask}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                  />
                  <div>
                    <div
                      className={`font-medium ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    )}
                  </div>
                </label>

                {canAdmin && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Edit task"
                      onClick={() => handleStartEditTask(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete task"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}

        {!!tasks.length && <p>No tasks yet</p>}
      </ul>
    </div>
  );
};
