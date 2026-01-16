"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Edit2, Loader2, Trash2, Filter } from "lucide-react"
import { Role, hasRole } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface House {
    _id: string
    doorNumber: string
    status: "vacant" | "occupied"
    rentAmount: number
    depositAmount: number
    apartment: {
        _id: string
        name: string
    }
    tenant?: {
        name: string
        email: string
        phone?: string
    }
    additionalCharges: {
        water: number
        electricity: number
        other?: { label: string; amount: number }[]
    }
}

interface Apartment {
    _id: string
    name: string
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function AdminHousesManagement() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [houses, setHouses] = useState<House[]>([])
    const [apartments, setApartments] = useState<Apartment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedHouses, setSelectedHouses] = useState<Set<string>>(new Set())
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"" | "vacant" | "occupied">("")
    const [apartmentFilter, setApartmentFilter] = useState("")

    // Edit form state
    const [editForm, setEditForm] = useState({
        rentAmount: "",
        depositAmount: "",
        waterCharge: "",
        electricityCharge: "",
        status: "" as "" | "vacant" | "occupied"
    })

    const [updateError, setUpdateError] = useState<string | null>(null)
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    /* Authorization check */
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

        fetchHouses(1)
    }, [session, status])

    const fetchHouses = async (page: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter }),
                ...(apartmentFilter && { apartmentId: apartmentFilter }),
            })

            const res = await fetch(`/api/admin/houses?${params}`)
            const data = await res.json()

            if (res.ok) {
                setHouses(data.houses)
                setApartments(data.apartments)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error("Error fetching houses:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectHouse = (houseId: string) => {
        const newSelected = new Set(selectedHouses)
        if (newSelected.has(houseId)) {
            newSelected.delete(houseId)
        } else {
            newSelected.add(houseId)
        }
        setSelectedHouses(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedHouses.size === houses.length) {
            setSelectedHouses(new Set())
        } else {
            setSelectedHouses(new Set(houses.map(h => h._id)))
        }
    }

    const handleOpenEditModal = () => {
        if (selectedHouses.size === 0) {
            setUpdateError("Please select at least one house to edit")
            return
        }
        setIsEditModalOpen(true)
        setUpdateError(null)
        setUpdateSuccess(null)
    }

    const handleUpdateHouses = async () => {
        setUpdateError(null)
        setUpdateSuccess(null)
        setIsUpdating(true)

        try {
            const updates: Record<string, unknown> = {}

            if (editForm.rentAmount) {
                const amount = parseFloat(editForm.rentAmount)
                if (isNaN(amount) || amount < 0) {
                    setUpdateError("Invalid rent amount")
                    setIsUpdating(false)
                    return
                }
                updates.rentAmount = amount
            }

            if (editForm.depositAmount) {
                const amount = parseFloat(editForm.depositAmount)
                if (isNaN(amount) || amount < 0) {
                    setUpdateError("Invalid deposit amount")
                    setIsUpdating(false)
                    return
                }
                updates.depositAmount = amount
            }

            if (editForm.status) {
                updates.status = editForm.status
            }

            if (editForm.waterCharge || editForm.electricityCharge) {
                updates.additionalCharges = {}

                if (editForm.waterCharge) {
                    const amount = parseFloat(editForm.waterCharge)
                    if (isNaN(amount) || amount < 0) {
                        setUpdateError("Invalid water charge")
                        setIsUpdating(false)
                        return
                    }
                    (updates.additionalCharges as Record<string, number>).water = amount
                }

                if (editForm.electricityCharge) {
                    const amount = parseFloat(editForm.electricityCharge)
                    if (isNaN(amount) || amount < 0) {
                        setUpdateError("Invalid electricity charge")
                        setIsUpdating(false)
                        return
                    }
                    (updates.additionalCharges as Record<string, number>).electricity = amount
                }
            }

            if (Object.keys(updates).length === 0) {
                setUpdateError("Please enter at least one field to update")
                setIsUpdating(false)
                return
            }

            const response = await fetch("/api/admin/houses", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    houseIds: Array.from(selectedHouses),
                    updates
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setUpdateError(data.error || "Failed to update houses")
            } else {
                setUpdateSuccess(data.message)
                setEditForm({
                    rentAmount: "",
                    depositAmount: "",
                    waterCharge: "",
                    electricityCharge: "",
                    status: ""
                })
                setSelectedHouses(new Set())
                fetchHouses(pagination.page)
                setTimeout(() => {
                    setIsEditModalOpen(false)
                    setUpdateSuccess(null)
                }, 2000)
            }
        } catch (error) {
            console.error("Update error:", error)
            setUpdateError("An error occurred. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <main className="container px-4 py-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="font-bold text-3xl mb-2 flex items-center gap-2">
                    <Home className="h-8 w-8" />
                    House Management
                </h1>
                <p className="text-muted-foreground">
                    View and modify house details individually or in bulk
                </p>
            </div>

            {/* Actions and Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Search Door Number</Label>
                            <Input
                                placeholder="e.g., G1, A2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && fetchHouses(1)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "" | "vacant" | "occupied")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">All Statuses</option>
                                <option value="vacant">Vacant</option>
                                <option value="occupied">Occupied</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Apartment</Label>
                            <select
                                value={apartmentFilter}
                                onChange={(e) => setApartmentFilter(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">All Apartments</option>
                                {apartments.map(apt => (
                                    <option key={apt._id} value={apt._id}>
                                        {apt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => fetchHouses(1)}>Apply Filters</Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm("")
                                setStatusFilter("")
                                setApartmentFilter("")
                                fetchHouses(1)
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>

                    {selectedHouses.size > 0 && (
                        <div className="pt-4 border-t flex gap-2 flex-wrap">
                            <Button onClick={handleOpenEditModal}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit {selectedHouses.size} Selected
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedHouses(new Set())}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Houses Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Houses ({pagination.total})</CardTitle>
                    <CardDescription>
                        Select houses to edit them individually or in bulk
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted text-left">
                            <tr>
                                <th className="p-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedHouses.size === houses.length && houses.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded"
                                    />
                                </th>
                                <th className="p-2">Door</th>
                                <th className="p-2">Apartment</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Rent</th>
                                <th className="p-2">Deposit</th>
                                <th className="p-2">Water</th>
                                <th className="p-2">Electricity</th>
                                <th className="p-2">Tenant</th>
                            </tr>
                            </thead>
                            <tbody>
                            {houses.map(house => (
                                <tr key={house._id} className="border-t hover:bg-muted/50">
                                    <td className="p-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedHouses.has(house._id)}
                                            onChange={() => handleSelectHouse(house._id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="p-2 font-medium">{house.doorNumber}</td>
                                    <td className="p-2">{house.apartment.name}</td>
                                    <td className="p-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${
                                                    house.status === "vacant"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-orange-100 text-orange-700"
                                                }`}
                                            >
                                                {house.status}
                                            </span>
                                    </td>
                                    <td className="p-2">KSh {house.rentAmount.toLocaleString()}</td>
                                    <td className="p-2">KSh {house.depositAmount.toLocaleString()}</td>
                                    <td className="p-2">KSh {house.additionalCharges.water}</td>
                                    <td className="p-2">KSh {house.additionalCharges.electricity}</td>
                                    <td className="p-2">
                                        {house.tenant ? (
                                            <div className="text-sm">
                                                <div>{house.tenant.name}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {house.tenant.phone}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => fetchHouses(pagination.page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="px-4 py-2 text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchHouses(pagination.page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit {selectedHouses.size} House(s)</DialogTitle>
                        <DialogDescription>
                            Fill in only the fields you want to update. Empty fields will not be changed.
                        </DialogDescription>
                    </DialogHeader>

                    {updateError && (
                        <Alert variant="destructive">
                            <AlertDescription>{updateError}</AlertDescription>
                        </Alert>
                    )}

                    {updateSuccess && (
                        <Alert className="border-primary bg-primary/10">
                            <AlertDescription className="text-primary">
                                {updateSuccess}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "" | "vacant" | "occupied" })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Don&#39;t change</option>
                                <option value="vacant">Vacant</option>
                                <option value="occupied">Occupied</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rent">Rent Amount (KSh)</Label>
                            <Input
                                id="rent"
                                type="number"
                                placeholder="Leave empty to skip"
                                value={editForm.rentAmount}
                                onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit">Deposit Amount (KSh)</Label>
                            <Input
                                id="deposit"
                                type="number"
                                placeholder="Leave empty to skip"
                                value={editForm.depositAmount}
                                onChange={(e) => setEditForm({ ...editForm, depositAmount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="water">Water Charge (KSh)</Label>
                            <Input
                                id="water"
                                type="number"
                                placeholder="Leave empty to skip"
                                value={editForm.waterCharge}
                                onChange={(e) => setEditForm({ ...editForm, waterCharge: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="electricity">Electricity Charge (KSh)</Label>
                            <Input
                                id="electricity"
                                type="number"
                                placeholder="Leave empty to skip"
                                value={editForm.electricityCharge}
                                onChange={(e) => setEditForm({ ...editForm, electricityCharge: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={handleUpdateHouses}
                                disabled={isUpdating}
                                className="flex-1"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Houses"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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