"use client";

import { db } from "@/lib/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
  type Timestamp,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type UpdateData,
} from "firebase/firestore";

export type ListDoc = {
  id: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  members: Record<string, "admin" | "viewer">;
  memberEmails?: string[];
  createdAt?: Timestamp;
};

export type TaskDoc = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt?: Timestamp;
  createdBy: string;
};

type ListFS = Omit<ListDoc, "id">;
type TaskFS = Omit<TaskDoc, "id">;

const listConverter: FirestoreDataConverter<ListFS> = {
  toFirestore(model: ListFS) {
    return model;
  },
  fromFirestore(snapshot) {
    return snapshot.data() as ListFS;
  },
};

const taskConverter: FirestoreDataConverter<TaskFS> = {
  toFirestore(model: TaskFS) {
    return model;
  },
  fromFirestore(snapshot) {
    return snapshot.data() as TaskFS;
  },
};

const listsCollection = collection(db, "lists").withConverter(listConverter);
const listDocument = (listId: string) =>
  doc(db, "lists", listId).withConverter(listConverter);

const tasksCollection = (listId: string) =>
  collection(db, "lists", listId, "tasks").withConverter(taskConverter);
const taskDocument = (listId: string, taskId: string) =>
  doc(db, "lists", listId, "tasks", taskId).withConverter(taskConverter);

const normalizeEmail = (emailInput: string) => emailInput.trim().toLowerCase();

export function watchMyLists(
  userId: string,
  onChange: (lists: ListDoc[]) => void
): Unsubscribe {
  const builtQuery = query(
    listsCollection,
    where("ownerId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(builtQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...(snapshotDoc.data() as ListFS),
      }))
    );
  });
}

export function watchSharedLists(
  email: string,
  onChange: (lists: ListDoc[]) => void
): Unsubscribe {
  const builtQuery = query(
    listsCollection,
    where("memberEmails", "array-contains", normalizeEmail(email)),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(builtQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...(snapshotDoc.data() as ListFS),
      }))
    );
  });
}

export function watchAccessibleLists(
  userId: string,
  email: string,
  onChange: (lists: ListDoc[]) => void
): Unsubscribe {
  let ownedLists: ListDoc[] = [];
  let sharedLists: ListDoc[] = [];

  const emitMerged = () => {
    const merged = new Map<string, ListDoc>();
    [...ownedLists, ...sharedLists].forEach((list) => merged.set(list.id, list));
    onChange([...merged.values()]);
  };

  const unsubscribeOwned = watchMyLists(userId, (nextOwned) => {
    ownedLists = nextOwned;
    emitMerged();
  });

  const unsubscribeShared = watchSharedLists(email, (nextShared) => {
    sharedLists = nextShared;
    emitMerged();
  });

  return () => {
    unsubscribeOwned();
    unsubscribeShared();
  };
}

export async function createList(
  ownerId: string,
  ownerEmail: string,
  title: string
) {
  const normalizedEmail = normalizeEmail(ownerEmail);

  const payload: ListFS = {
    title: title.trim(),
    ownerId,
    ownerEmail: normalizedEmail,
    members: { [normalizedEmail]: "admin" },
    memberEmails: [normalizedEmail],
    createdAt: serverTimestamp() as unknown as Timestamp,
  };

  return addDoc(listsCollection, payload);
}

export async function renameList(listId: string, title: string) {
  const update: UpdateData<ListFS> = { title: title.trim() };
  return updateDoc(listDocument(listId), update);
}

export async function deleteListWithTasks(listId: string) {
  const tasksSnapshot = await getDocs(tasksCollection(listId));
  const batch = writeBatch(db);

  tasksSnapshot.forEach((taskSnapshot) => batch.delete(taskSnapshot.ref));
  batch.delete(listDocument(listId));

  await batch.commit();
}

export async function addTask(
  listId: string,
  taskData: { title: string; description: string; createdBy: string }
) {
  const payload: TaskFS = {
    title: taskData.title,
    description: taskData.description,
    createdBy: taskData.createdBy,
    completed: false,
    createdAt: serverTimestamp() as unknown as Timestamp,
  };

  return addDoc(tasksCollection(listId), payload);
}

export function watchTasks(
  listId: string,
  onChange: (tasks: TaskDoc[]) => void
): Unsubscribe {
  const builtQuery = query(
    tasksCollection(listId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(builtQuery, (snapshot) =>
    onChange(
      snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...(snapshotDoc.data() as TaskFS),
      }))
    )
  );
}

export async function updateTask(
  listId: string,
  taskId: string,
  patch: Partial<Pick<TaskDoc, "title" | "description">>
) {
  const update: UpdateData<TaskFS> = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
  };
  return updateDoc(taskDocument(listId, taskId), update);
}

export async function toggleTask(
  listId: string,
  taskId: string,
  completed: boolean
) {
  const update: UpdateData<TaskFS> = { completed };
  return updateDoc(taskDocument(listId, taskId), update);
}

export async function deleteTask(listId: string, taskId: string) {
  return deleteDoc(taskDocument(listId, taskId));
}

export async function setMemberRole(
  listId: string,
  rawEmail: string,
  role: "admin" | "viewer"
) {
  const email = normalizeEmail(rawEmail);

  const partial: PartialWithFieldValue<ListFS> = {
    members: { [email]: role },
    memberEmails: arrayUnion(email),
  };

  return setDoc(listDocument(listId), partial, { merge: true });
}

export async function removeMember(listId: string, rawEmail: string) {
  const email = normalizeEmail(rawEmail);

  const listSnapshot = await getDoc(listDocument(listId));
  if (!listSnapshot.exists()) {
    return;
  }

  const current = listSnapshot.data();
  const nextMembers: Record<string, "admin" | "viewer"> = {
    ...(current.members ?? {}),
  };
  delete nextMembers[email];

  const update: UpdateData<ListFS> = {
    members: nextMembers,
    memberEmails: arrayRemove(email),
  };

  return updateDoc(listDocument(listId), update);
}