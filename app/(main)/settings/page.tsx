"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passErr, setPassErr] = useState("");

  const changePassword = async () => {
    if (!curPass || !newPass) {
      setPassErr("Fill in both fields");
      return;
    }
    if (newPass.length < 6) {
      setPassErr("New password must be at least 6 characters");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: curPass,
        new_password: newPass,
      }),
    });
    if (res.ok) {
      setCurPass("");
      setNewPass("");
      setPassErr("");
      toast("Password updated!");
    } else {
      const data = await res.json();
      setPassErr(data.error || "Failed to update password");
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This cannot be undone. All your confessions and data will be deleted forever."
      )
    )
      return;
    if (!confirm("Really really sure?")) return;
    const res = await fetch("/api/auth/account", { method: "DELETE" });
    if (res.ok) {
      toast("Account deleted. Goodbye!");
      await signOut({ redirect: false });
      router.push("/login");
    }
  };

  return (
    <>
      <div className="font-serif text-lg font-bold px-4 py-3.5 border-b border-rose-200 bg-rose-50/50">
        Settings
      </div>

      <div className="px-4 py-5 border-b border-rose-100">
        <h3 className="text-sm font-bold mb-3">Account</h3>
        <p className="text-sm text-warm-800/50 mb-3">
          Signed in as{" "}
          <b className="text-warm-900">@{session?.user?.username}</b>
        </p>
        <Link
          href={`/profile/${session?.user?.username}`}
          className="inline-block px-5 py-2 rounded-lg font-semibold text-sm border-[1.5px] border-rose-200 hover:border-rose-500 hover:text-rose-500 transition-colors"
        >
          View Profile
        </Link>
      </div>

      <div className="px-4 py-5 border-b border-rose-100">
        <h3 className="text-sm font-bold mb-3">Change Password</h3>
        <div className="mb-2.5">
          <label className="block text-xs font-medium text-warm-800/50 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            className="w-full px-3 py-2 border-[1.5px] border-rose-200 rounded-lg text-sm outline-none focus:border-rose-500"
          />
        </div>
        <div className="mb-2.5">
          <label className="block text-xs font-medium text-warm-800/50 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="6+ characters"
            className="w-full px-3 py-2 border-[1.5px] border-rose-200 rounded-lg text-sm outline-none focus:border-rose-500"
          />
        </div>
        {passErr && <p className="text-red-500 text-xs mb-2">{passErr}</p>}
        <button
          onClick={changePassword}
          className="px-5 py-2 gradient-bg text-white rounded-lg font-bold text-sm"
        >
          Update Password
        </button>
      </div>

      <div className="px-4 py-5 border-b border-rose-100">
        <h3 className="text-sm font-bold mb-3">Session</h3>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-5 py-2 rounded-lg font-semibold text-sm border-[1.5px] border-rose-200 hover:border-rose-500 hover:text-rose-500 transition-colors"
        >
          Log Out
        </button>
      </div>

      <div className="px-4 py-5">
        <h3 className="text-sm font-bold mb-3">Danger Zone</h3>
        <p className="text-xs text-warm-800/50 mb-2.5">
          This permanently deletes your account and all your data.
        </p>
        <button
          onClick={deleteAccount}
          className="px-5 py-2 bg-red-50 text-red-500 border border-red-200 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </>
  );
}
