"use client";

import { clearAuthCookie } from "@/lib/auth-cookie";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export const WelcomeBar = () => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  useEffect(() => onAuthStateChanged(auth, setCurrentUser), []);

  async function handleLogout() {
    try {
      await signOut(auth);
      clearAuthCookie();
      window.location.replace("/auth");
    } catch {
      toast.error("Sign out failed");
    }
  }

  const welcomeName = currentUser?.displayName;

  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Your lists</h1>
      {currentUser && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{`Welcome, ${welcomeName}`}</span>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      )}
    </div>
  );
};
