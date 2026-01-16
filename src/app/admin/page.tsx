"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Edit2 } from "lucide-react"

import { Role, hasRole } from "@/lib/roles"
import {EditModal} from "@/components/home/EditUserModal";


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
        limit: 10,
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
                Loading...
            </div>
        )
    }

    /* ---------------- UI ---------------- */
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <input
                        className="px-4 py-2 border rounded-lg"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchUsers(1)}
                    />

                    <select
                        value={roleFilter}
                        onChange={e =>
                            setRoleFilter(e.target.value as Role | "")
                        }
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Roles</option>
                        {Object.values(Role).map(role => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <table className="w-full">
                    <thead className="bg-gray-100 text-left">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Roles</th>
                        <th className="p-2">Joined</th>
                        <th />
                    </tr>
                    </thead>

                    <tbody>
                    {users.map(user => (
                        <tr key={user._id} className="border-t">
                            <td className="p-2">{user.name}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2 flex gap-1 flex-wrap">
                                {user.roles.map(role => (
                                    <span
                                        key={role}
                                        className="px-2 py-1 text-xs bg-blue-100 rounded"
                                    >
                      {role}
                    </span>
                                ))}
                            </td>
                            <td className="p-2">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                                <button onClick={() => setEditingUser(user)}>
                                    <Edit2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {editingUser && (
                    <EditModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSave={handleUpdateUser}
                    />
                )}
            </div>
        </div>
    )
}
