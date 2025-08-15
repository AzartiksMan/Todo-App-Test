"use client";

import { AuthField } from "@/components/AuthField";

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center bg-white/80 rounded-xl shadow-xl px-8 py-6 max-w-md w-full">
        <div className="text-4xl font-bold mb-4 text-gray-900">
          Welcome to ITA
        </div>
        <p className="mb-6 text-gray-600">Register or login to start!</p>

        <div className="w-full">
          <AuthField />
        </div>
      </div>
    </div>
  );
}
