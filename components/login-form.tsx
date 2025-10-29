"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";
import { EyeOff, Eye } from "lucide-react";
import { LoginBackgroundSlider } from "./login-background-slide";
import { LoginFormSkeleton } from "./login-skeleton";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  useEffect(() => {
    const pageLoadTimer = setTimeout(() => {
      setIsPageLoading(false);
      const showFormTimer = setTimeout(() => setShowForm(true), 150);
      return () => clearTimeout(showFormTimer);
    }, 1500);
    return () => clearTimeout(pageLoadTimer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login gagal");

      login({
        username: data.username,
        role: data.role,
        companyName: data.companyName,
        vendorType: data.vendorType, 
      });
      router.push("/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen w-full grid-cols-1 lg:grid-cols-[0.8fr_2fr] overflow-hidden bg-background">
      <div
        className={cn(
          "flex flex-col justify-center px-6 md:px-16 lg:px-20 z-10",
          "items-center text-center" 
        )}
      >

        <div
            className={cn(
              "w-full max-w-md transition-all duration-1000",
              showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
          >
          <a
            href="#"
            className="flex items-center gap-2 font-medium mb-10 text-primary"
          >
            <div className="flex items-center justify-center">
              <img
                src="/images/schneider.png"
                alt="Schneider Electric"
                className="h-6 w-auto"
              />
            </div>
            <p className="text-primary">Schneider Electric Cikarang</p>
          </a>
        </div>

        {isPageLoading ? (
          <LoginFormSkeleton />
        ) : (
          <div
            className={cn(
              "w-full max-w-md transition-all duration-1000",
              showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
          >
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <FieldGroup>
                <div className="flex flex-col items-start gap-1">
                  <h1 className="text-3xl font-semibold text-start">Login to your account</h1>
                  <p className="text-muted-foreground text-sm font-light text-start">
                    Enter your username below to login to your account
                  </p>
                </div>

                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    placeholder="example: admin"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700"
                      aria-label={
                        isPasswordVisible ? "Hide Password" : "See Password"
                      }
                    >
                      {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                {error && (
                  <p className="text-sm text-center text-red-500 bg-red-500/10 p-2 rounded-md">
                    {error}
                  </p>
                )}

                <Field>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Login"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
            <div className="mt-8 text-center text-sm">
              <span className="text-muted-foreground">
                Or access other portals:
              </span>
              <div className="flex items-center justify-center gap-4 mt-3">
                <Button variant="outline" asChild>
                  <a
                    href="https://vro-fe.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VRO
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://secpanel.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trisutorpro
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative hidden lg:block">
        <LoginBackgroundSlider />
      </div>
    </div>
  );
}
