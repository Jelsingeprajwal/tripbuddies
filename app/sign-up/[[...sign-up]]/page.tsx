"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: signupError } = await signUp.password({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (signupError) {
        throw signupError;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        throw verificationError;
      }

      setPendingVerification(true);
      setMessage("A verification code has been sent to your email.");
    } catch (err) {
      console.error("Signup failed:", err);
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: verificationError } =
        await signUp.verifications.verifyEmailCode({ code });

      if (verificationError) {
        throw verificationError;
      }

      if (signUp.status !== "complete") {
        throw new Error(
          `Signup is not complete. Current status: ${signUp.status}`,
        );
      }

      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        throw finalizeError;
      }

      const response = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          "Your Clerk account was created, but your database profile could not be saved. Please try again.",
        );
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Email verification or profile sync failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your email or save your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || fetchStatus === "fetching";

  if (pendingVerification) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-6 text-2xl font-bold">Verify your email</h1>

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
          >
            {busy ? "Please wait..." : "Verify email and create account"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Create your Tripbuddies account
      </h1>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="mb-1 block">
            First name
          </label>
          <input
            id="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1 block">
            Last name
          </label>
          <input
            id="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
        >
          {busy ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </main>
  );
}
