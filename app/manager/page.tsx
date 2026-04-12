"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/lib/types";

export default function ManagerPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userInfo, setUserInfo] = useState<{ employeeId: string; role: string } | null>(null);
  const [loadingEmps, setLoadingEmps] = useState(true);

  // Add employee form state
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "manager">("employee");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role !== "manager") {
          router.push("/dashboard");
          return;
        }
        setUserInfo(d);
      });

    fetch("/api/manager/employees")
      .then((r) => r.json())
      .then((d) => {
        setEmployees(d.employees ?? []);
        setLoadingEmps(false);
      });
  }, [router]);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/manager/add-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: newName, pin: newPin, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add employee");
      } else {
        setAddSuccess(`Employee "${newName}" added successfully.`);
        setNewId("");
        setNewName("");
        setNewPin("");
        setNewRole("employee");
        // Refresh employee list
        const updated = await fetch("/api/manager/employees").then((r) => r.json());
        setEmployees(updated.employees ?? []);
      }
    } catch {
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    const res = await fetch("/api/manager/delete-employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDeleteError(data.error ?? "Failed to delete employee");
    } else {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Dashboard
            </a>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎟️</span>
              <span className="text-lg font-bold text-white">Manager Panel</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Add Employee */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-5">Add Employee</h2>
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Employee ID</label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 101"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">PIN (4 digits)</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
                maxLength={4}
                pattern="\d{4}"
                inputMode="numeric"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "employee" | "manager")}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              {addError && (
                <div className="mb-3 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="mb-3 px-3 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
                  {addSuccess}
                </div>
              )}
              <button
                type="submit"
                disabled={addLoading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {addLoading ? "Adding…" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>

        {/* Employee list */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-5">All Employees</h2>
          {deleteError && (
            <div className="mb-4 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {deleteError}
            </div>
          )}
          {loadingEmps ? (
            <div className="text-slate-400">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                    <th className="text-left py-2 px-3">ID</th>
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Role</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-2.5 px-3 text-slate-300 font-mono">{emp.id}</td>
                      <td className="py-2.5 px-3 text-white">{emp.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          emp.role === "manager"
                            ? "bg-indigo-600/30 text-indigo-300 border border-indigo-600/50"
                            : "bg-slate-700 text-slate-300"
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {emp.id !== "1" && emp.id !== userInfo?.employeeId && (
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/40 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
