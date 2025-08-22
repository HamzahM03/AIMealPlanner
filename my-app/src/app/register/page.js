"use client"
import { useState } from "react"
export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  async function onSubmit(e) {
    e.preventDefault()
    setErr("")
    if (pw !== pw2) {
      setErr("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pw }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Registration failed")
      }
      window.location.href = "/onboarding"
    } catch (e) {
      setErr(e.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-4 fixed inset-0">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xs md:max-w-sm lg:max-w-md space-y-3 md:space-y-4 bg-white/95 backdrop-blur-sm p-4 md:p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20"
      >
        <div className="text-center space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm md:text-base text-gray-600">Join us today</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <label className="text-sm md:text-base font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border-0 bg-gray-50 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm md:text-base font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-0 bg-gray-50 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm md:text-base font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border-0 bg-gray-50 px-3 py-2 md:px-4 md:py-2.5 pr-12 md:pr-14 text-sm md:text-base text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-sm md:text-base font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm md:text-base font-medium text-gray-700">Confirm password</label>
            <input
              type={showPw ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border-0 bg-gray-50 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              placeholder="Repeat password"
            />
          </div>
        </div>

        {err && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 md:p-4">
            <p className="text-sm md:text-base text-red-600">{err}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating…
            </span>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-center text-sm md:text-base text-gray-600">
          Already have an account?{" "}
          <a className="font-medium text-blue-600 hover:text-blue-500 transition-colors" href="/login">
            Sign in
          </a>
        </p>
      </form>
    </div>
  )
}