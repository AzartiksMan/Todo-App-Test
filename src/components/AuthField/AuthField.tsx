"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { LoginForm } from "../LoginForm";
import { RegisterForm } from "../RegisterForm/RegisterForm";

type Mode = "login" | "register" | null;

export function AuthField() {
  const [mode, setMode] = useState<Mode>(null);

  const handleBack = () => setMode(null);

  return (
    <div className="flex flex-col items-center gap-y-5">
      {!mode && (
        <div className="flex flex-col gap-y-6">
          <div className="flex gap-4">
            <Button type="button" onClick={() => setMode("login")}>
              Login
            </Button>
            <Button type="button" onClick={() => setMode("register")}>
              Register
            </Button>
          </div>
        </div>
      )}

      {mode === "login" && <LoginForm onBack={handleBack} />}

      {mode === "register" && <RegisterForm onBack={handleBack} />}
    </div>
  );
}
