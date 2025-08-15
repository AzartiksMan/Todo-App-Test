"use client";

import {
  type AuthError,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useRouter } from "next/navigation";
import {
  RegisterFormValues,
  registerSchema,
} from "@/shared/validators/authSchema";
import { toast } from "sonner";
import { setAuthCookie } from "@/lib/auth-cookie";

interface Props {
  onBack: () => void;
}

export const RegisterForm: React.FC<Props> = ({ onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const email = data.email.trim().toLowerCase();
      const username = data.username?.trim();

      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        data.password
      );

      if (username) {
        await updateProfile(cred.user, { displayName: username });
      }

      setAuthCookie(cred.user.uid);

      form.reset({ username: "", email: "", password: "" });
      toast.success("Registration successful!");
      router.push("/");
    } catch (error) {
      const err = error as AuthError;
      toast.error(err.message || "Registration failed");
    }
  };
  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-80 space-y-4 border p-6 rounded-md"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pr-14"
                    placeholder="Password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs h-auto px-2"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={form.formState.isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registering..." : "Register"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={form.formState.isSubmitting}
          >
            Go back
          </Button>
        </div>
      </form>
    </Form>
  );
};
