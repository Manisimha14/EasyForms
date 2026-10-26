import { UserButton, useUser } from "@clerk/react";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between p-6 border-b">
        <h1 className="text-xl font-bold">EasyForms</h1>

        <UserButton />
      </nav>

      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.firstName || "there"} 👋
        </h1>

        <p className="mt-2 text-gray-600">Create and manage your forms.</p>

        <button className="mt-6 px-5 py-3 rounded-lg bg-black text-white">
          + Create Form
        </button>
      </main>
    </div>
  );
}
