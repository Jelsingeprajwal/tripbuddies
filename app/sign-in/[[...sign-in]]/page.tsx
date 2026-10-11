"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loading = submitting || fetchStatus === "fetching";

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const { error } = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.push("/");
            router.refresh();
          },
        });
        return;
      }

      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (!emailCodeFactor) {
          setMessage(
            "Email verification is not available for this sign-in. Please check your Clerk configuration.",
          );
          return;
        }

        const { error: verificationError } = await signIn.mfa.sendEmailCode();

        if (verificationError) {
          setMessage(verificationError.message);
          return;
        }

        setShowVerification(true);
        setMessage("Check your email for a verification code.");
        return;
      }

      setMessage(`Additional verification is required: ${signIn.status}`);
    } catch (error) {
      console.error("Sign-in error:", error);
      setMessage("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: code.trim(),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.push("/");
            router.refresh();
          },
        });
      } else {
        setMessage(
          `Verification is not complete. Current status: ${signIn.status}`,
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setMessage("Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    setMessage("");
    setSubmitting(true);

    try {
      const { error } = await signIn.mfa.sendEmailCode();

      setMessage(
        error ? error.message : "A new verification code has been sent.",
      );
    } catch (error) {
      console.error("Resend code error:", error);
      setMessage("Could not resend the verification code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>

          <p className="mt-2 text-gray-500">
            Sign in to continue your journey with Tripbuddies.
          </p>
        </div>

        {!showVerification ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              required
              type="email"
              autoComplete="username"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              required
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 p-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the verification code sent to {email}.
            </p>

            <input
              required
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Verification code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 p-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify and sign in"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleResendCode}
              className="w-full text-sm underline disabled:opacity-50"
            >
              Resend verification code
            </button>
          </form>
        )}

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="text-center text-sm text-gray-700"
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-semibold underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
