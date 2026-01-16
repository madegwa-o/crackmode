'use client'

import { useState } from "react";

export default function MakeAdmin() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleMakeAdmin = async () => {
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/make-admin", {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to make admin");
            }

            setMessage(data.message || "User promoted successfully");
        } catch (err: unknown) { // ✅ use unknown instead of any
            if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <button
                onClick={handleMakeAdmin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Processing..." : "Make Admin"}
            </button>

            {message && (
                <p className="mt-3 text-sm text-gray-700">{message}</p>
            )}
        </div>
    );
}
