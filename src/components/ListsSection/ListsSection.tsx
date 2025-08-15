"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ListCard } from "@/components/ListCard";
import { type ListDoc, watchAccessibleLists } from "@/lib/firestore";
import { WelcomeBar } from "../WelcomeBar";
import { AddListBar } from "../AddListBar";

export const ListsSection = () => {
  const [lists, setLists] = useState<ListDoc[]>([]);

  useEffect(() => {
    let unsubscribeLists: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeLists?.();

      if (user?.uid && user.email) {
        unsubscribeLists = watchAccessibleLists(user.uid, user.email, setLists);
      } else {
        setLists([]);
        unsubscribeLists = undefined;
      }
    });

    return () => {
      unsubscribeLists?.();
      unsubscribeAuth();
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <WelcomeBar />

      <AddListBar />

      <div className="grid gap-3">
        {!lists.length && (
          <p>No lists yet</p>
        )}
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
};
