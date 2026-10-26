import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between p-6 border-b">
        <Link to="/" className="text-2xl font-bold">
          EasyForms
        </Link>

        <div className="flex items-center gap-4">
          {/* Logged out */}
          <Show when="signed-out">
            <SignInButton />

            <SignUpButton>
              <button className="px-4 py-2 rounded-lg bg-black text-white">
                Get Started
              </button>
            </SignUpButton>
          </Show>

          {/* Logged in */}
          <Show when="signed-in">
            <Link to="/dashboard" className="px-4 py-2">
              Dashboard
            </Link>

            <UserButton />
          </Show>
        </div>
      </nav>

      <main className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-bold">
          Create forms.
          <br />
          Collect responses.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-600">
          Build beautiful forms, share them, and understand your responses.
        </p>

        <div className="mt-8">
          <Show when="signed-out">
            <SignUpButton>
              <button className="px-6 py-3 rounded-xl bg-black text-white">
                Create your first form
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl bg-black text-white"
            >
              Go to Dashboard
            </Link>
          </Show>
        </div>
      </main>
    </div>
  );
}
