"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Send, Users, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Role, hasRole } from "@/lib/roles";

interface UserOption {
    _id: string;
    name: string;
    email: string;
}

export default function HandleEmails() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [emailMode, setEmailMode] = useState<"single" | "bulk">("single");
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
    const [singleRecipient, setSingleRecipient] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<Role | "">("");

    // Authorization check
    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.replace("/");
            return;
        }

        const roles = session.user.roles ?? [Role.USER];
        if (!hasRole(roles, Role.ADMIN)) {
            router.replace("/");
            return;
        }

        fetchUsers();
    }, [session, status, roleFilter]);

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (roleFilter) params.append("role", roleFilter);

            const res = await fetch(`/api/email/users?${params}`);
            const data = await res.json();

            if (res.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSendEmail = async () => {
        setLoading(true);
        setResult("");

        try {
            let recipients: string | string[];

            if (emailMode === "single") {
                if (!singleRecipient) {
                    setResult("❌ Please enter a recipient email");
                    setLoading(false);
                    return;
                }
                recipients = singleRecipient;
            } else {
                if (selectedUsers.length === 0) {
                    setResult("❌ Please select at least one recipient");
                    setLoading(false);
                    return;
                }
                recipients = selectedUsers.map(u => u.email);
            }

            const response = await fetch("/api/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients,
                    subject,
                    text: message,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (emailMode === "bulk") {
                    setResult(
                        `✅ ${data.message}! (Sent: ${data.sent}, Failed: ${data.failed})`
                    );
                } else {
                    setResult(`✅ ${data.message}`);
                }

                // Clear form
                setSingleRecipient("");
                setSelectedUsers([]);
                setSubject("");
                setMessage("");
            } else {
                setResult(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setResult(
                `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (user: UserOption) => {
        setSelectedUsers(prev => {
            const exists = prev.find(u => u._id === user._id);
            if (exists) {
                return prev.filter(u => u._id !== user._id);
            } else {
                return [...prev, user];
            }
        });
    };

    const selectAllUsers = () => {
        setSelectedUsers([...users]);
    };

    const clearSelection = () => {
        setSelectedUsers([]);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 dotted-bg">
            <div className="max-w-4xl mx-auto space-y-6 py-8">
                <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
                    <h1 className="text-3xl font-bold text-card-foreground mb-6 flex items-center gap-2">
                        <Mail className="h-8 w-8" />
                        Send Emails
                    </h1>

                    {/* User Info */}
                    <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                            Logged in as:{" "}
                            <span className="font-semibold text-foreground">
                                {session?.user.email}
                            </span>
                        </p>
                    </div>

                    {/* Email Mode Toggle */}
                    <div className="mb-6 flex gap-4">
                        <Button
                            onClick={() => setEmailMode("single")}
                            variant={emailMode === "single" ? "default" : "outline"}
                            className="flex-1"
                        >
                            <UserIcon className="h-4 w-4 mr-2" />
                            Single Email
                        </Button>
                        <Button
                            onClick={() => setEmailMode("bulk")}
                            variant={emailMode === "bulk" ? "default" : "outline"}
                            className="flex-1"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Bulk Email
                        </Button>
                    </div>

                    {/* Recipients Section */}
                    <div className="mb-6 space-y-4">
                        <h3 className="font-semibold text-card-foreground">
                            Recipients
                        </h3>

                        {emailMode === "single" ? (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={singleRecipient}
                                    onChange={(e) => setSingleRecipient(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground"
                                    placeholder="user@example.com"
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="flex gap-4 mb-4">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) =>
                                            setRoleFilter(e.target.value as Role | "")
                                        }
                                        className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                                    >
                                        <option value="">All Roles</option>
                                        {Object.values(Role).map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>

                                    <Button
                                        onClick={selectAllUsers}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Select All ({users.length})
                                    </Button>
                                    <Button
                                        onClick={clearSelection}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Clear
                                    </Button>
                                </div>

                                {/* Selected Users Pills */}
                                {selectedUsers.length > 0 && (
                                    <div className="mb-4 p-4 bg-accent rounded-lg border border-border">
                                        <p className="text-sm font-medium mb-2">
                                            Selected: {selectedUsers.length} user(s)
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map((user) => (
                                                <span
                                                    key={user._id}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                                                >
                                                    {user.name}
                                                    <button
                                                        onClick={() =>
                                                            toggleUserSelection(user)
                                                        }
                                                        className="hover:bg-primary/80 rounded-full p-0.5"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* User List */}
                                <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
                                    {users.map((user) => (
                                        <label
                                            key={user._id}
                                            className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.some(
                                                    (u) => u._id === user._id
                                                )}
                                                onChange={() =>
                                                    toggleUserSelection(user)
                                                }
                                                className="h-4 w-4"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground"
                            placeholder="Email subject"
                        />
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none text-foreground"
                            placeholder="Enter your message here..."
                        />
                    </div>

                    {/* Send Button */}
                    <Button
                        onClick={handleSendEmail}
                        disabled={loading || !subject || !message}
                        className="w-full"
                    >
                        {loading ? (
                            "Sending..."
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Email
                            </>
                        )}
                    </Button>

                    {/* Result */}
                    {result && (
                        <div
                            className={`mt-4 p-4 rounded-lg border ${
                                result.startsWith("✅")
                                    ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                        >
                            {result}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <h3 className="font-semibold text-foreground mb-2">
                            Instructions:
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Choose between single or bulk email mode</li>
                            <li>
                                For single: Enter recipient email address
                            </li>
                            <li>
                                For bulk: Select users from the list (filter by role
                                if needed)
                            </li>
                            <li>Enter email subject and message</li>
                            <li>Click &quot;Send Email&quot; to deliver</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}