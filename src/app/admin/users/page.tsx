"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Edit2, Loader2, Users, Filter } from "lucide-react"

import { Role, hasRole } from "@/lib/roles"
import { EditModal } from "@/components/home/EditUserModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface AdminUser {
    _id: string
    name: string
    email: string
    phone?: string
    roles: Role[]
    createdAt: string
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function AdminHome() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<Role | "">("")

    /* ---------------- Authorization ---------------- */
    useEffect(() => {
        if (status === "loading") return

        if (!session) {
            router.replace("/")
            return
        }

        const roles = session.user.roles ?? [Role.USER]
        if (!hasRole(roles, Role.ADMIN)) {
            router.replace("/")
            return
        }

        fetchUsers(1)
    }, [session, status])

    /* ---------------- Data Fetch ---------------- */
    const fetchUsers = async (page: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(roleFilter && { role: roleFilter }),
            })

            const res = await fetch(`/api/admin/users?${params}`)
            const data = await res.json()

            if (res.ok) {
                setUsers(data.users)
                setPagination(data.pagination)
            }
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- Mutations ---------------- */
    const handleUpdateUser = async (
        userId: string,
        updates: Partial<AdminUser>
    ) => {
        const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ...updates }),
        })

        const data = await res.json()

        if (res.ok) {
            setUsers(prev =>
                prev.map(u => (u._id === userId ? data.user : u))
            )
            setEditingUser(null)
        } else {
            alert(data.error)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    /* ---------------- UI ---------------- */
    return (
        <main className="container px-4 py-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="font-bold text-3xl mb-2 flex items-center gap-2">
                    <Users className="h-8 w-8" />
                    User Management
                </h1>
                <p className="text-muted-foreground">
                    View and manage user accounts and permissions
                </p>
            </div>

            {/* Filters Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Search Users</Label>
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && fetchUsers(1)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Filter by Role</Label>
                            <select
                                value={roleFilter}
                                onChange={e =>
                                    setRoleFilter(e.target.value as Role | "")
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">All Roles</option>
                                {Object.values(Role).map(role => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => fetchUsers(1)}>
                            Apply Filters
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm("")
                                setRoleFilter("")
                                fetchUsers(1)
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Users ({pagination.total})</CardTitle>
                    <CardDescription>
                        Manage user accounts, roles, and permissions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted text-left">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Roles</th>
                                <th className="p-3">Joined</th>
                                <th className="p-3">Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {users.map(user => (
                                <tr key={user._id} className="border-t hover:bg-muted/50">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3 text-sm">{user.email}</td>
                                    <td className="p-3 text-sm">
                                        {user.phone || (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {user.roles.map(role => (
                                                <span
                                                    key={role}
                                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded"
                                                >
                                                        {role}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingUser(user)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found matching your filters
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => fetchUsers(pagination.page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="px-4 py-2 text-sm flex items-center">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchUsers(pagination.page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal - External Component */}
            {editingUser && (
                <EditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}

            {/* Back Button */}
            <Button
                variant="outline"
                onClick={() => router.push("/admin")}
                className="w-full mt-6"
            >
                ← Back to Admin Dashboard
            </Button>
        </main>
    )
}