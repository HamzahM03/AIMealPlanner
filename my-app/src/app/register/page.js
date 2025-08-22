"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("new@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "Failed to register");
        setLoading(false);
        return;
      }

      // auto sign-in after register
      const signin = await signIn("credentials", { email, password, redirect: false });
      if (signin?.error) window.location.href = "/login";
      else window.location.href = "/";
    } catch {
      setErr("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password (min 6)" />
        <button disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      </form>
      {err && <p style={{ color: "crimson", marginTop: 8 }}>{err}</p>}
      <p style={{ marginTop: 12 }}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </div>
  );
}
