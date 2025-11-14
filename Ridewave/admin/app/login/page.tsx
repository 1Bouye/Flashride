"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Invalid credentials");
      }

      const payload: { token: string } = await response.json();
      window.localStorage.setItem("flashride_admin_token", payload.token);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <Image
            src="https://dummyimage.com/48x48/665CFF/ffffff&text=FR"
            width={48}
            height={48}
            alt="Flashride Logo"
          />
          <h1>Flashride Admin</h1>
          <p>Sign in to review new driver registrations.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@flashride.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {errorMessage ? (
            <p className="error-text" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(
            circle at top left,
            rgba(102, 92, 255, 0.12),
            transparent 60%
          );
        }

        .login-card {
          width: min(420px, 100%);
          padding: 2.5rem;
          border-radius: 1rem;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }

        .login-header h1 {
          margin: 0;
          font-size: 1.75rem;
        }

        .login-header p {
          margin: 0;
          color: #64748b;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.95rem;
          color: #0f172a;
        }

        input {
          border: 1px solid #d0d7e6;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          background-color: #f8fafc;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus {
          outline: none;
          border-color: #665cff;
          box-shadow: 0 0 0 3px rgba(102, 92, 255, 0.2);
          background-color: #ffffff;
        }

        button {
          border: none;
          border-radius: 0.75rem;
          padding: 0.8rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #665cff, #312e81);
          color: white;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .error-text {
          margin: 0;
          color: #dc2626;
          font-size: 0.9rem;
        }
      `}</style>
    </main>
  );
}

