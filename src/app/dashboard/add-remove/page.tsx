"use client"

import { useApartment } from "@/hooks/use-apartment-context"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface House {
    _id: string
    doorNumber: string
    status: "occupied" | "vacant"
    tenantName?: string
    rentAmount: number
    depositAmount: number
}

interface HousesData {
    apartmentName: string
    units: House[]
}

export default function AddRemovePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { apartment } = useApartment()
    const [isClient, setIsClient] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state for adding tenant
    const [tenantEmail, setTenantEmail] = useState("")
    const [tenantPhone, setTenantPhone] = useState("")
    const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null)

    useEffect(() => {
        setIsClient(true)
        const houseId = searchParams.get('houseId')
        if (houseId) {
            setSelectedHouseId(houseId)
        }
    }, [searchParams])

    const { data, isLoading, error, mutate } = useSWR<HousesData>(
        apartment.apartmentId ? `/api/apartments/${apartment.apartmentId}/units` : null,
        fetcher,
    )

    const selectedHouse = data?.units.find(h => h._id === selectedHouseId)

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedHouseId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/houses/${selectedHouseId}/add-tenant`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantEmail: tenantEmail.toLowerCase().trim(),
                    tenantPhone: tenantPhone.trim(),
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to add tenant")
            }

            toast.success("Tenant added successfully!")
            setTenantEmail("")
            setTenantPhone("")
            mutate()

            // Redirect back to houses page after success
            setTimeout(() => {
                router.push("/houses")
            }, 1500)
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Failed to add tenant")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveTenant = async () => {
        if (!selectedHouseId) return

        if (!confirm("Are you sure you want to remove this tenant? This action cannot be undone.")) {
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/houses/${selectedHouseId}/remove-tenant`, {
                method: "DELETE",
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to remove tenant")
            }

            toast.success("Tenant removed successfully!")
            mutate()

            // Redirect back to houses page after success
            setTimeout(() => {
                router.push("/houses")
            }, 1500)
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Failed to add tenant")
            }
        } finally {
            setLoading(false)
        }
    }

    if (!apartment.apartmentId) {
        return (
            <main className="h-screen w-screen flex items-center justify-center bg-background">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Please select an apartment from the dropdown</p>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (isLoading || !isClient) {
        return (
            <main className="w-screen dotted-bg p-6 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="h-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-96 bg-muted rounded animate-pulse"></div>
                </div>
            </main>
        )
    }

    if (error || !data) {
        return (
            <main className="w-screen dotted-bg p-6 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">Failed to load data</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="w-screen dotted-bg p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/houses")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Manage Tenant</h1>
                        <p className="text-muted-foreground mt-1">
                            {data.apartmentName}
                        </p>
                    </div>
                </div>

                {/* House Selection */}
                {!selectedHouseId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select a House</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.units.map((house) => (
                                <div
                                    key={house._id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                    onClick={() => setSelectedHouseId(house._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-lg text-purple-600 dark:text-purple-400">
                                            {house.doorNumber}
                                        </div>
                                        <div>
                                            <p className="font-semibold">Unit {house.doorNumber}</p>
                                            {house.tenantName && (
                                                <p className="text-sm text-muted-foreground">{house.tenantName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        className={
                                            house.status === "occupied"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                        }
                                    >
                                        {house.status === "occupied" ? "Occupied" : "Vacant"}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Selected House Info */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-2xl text-purple-600 dark:text-purple-400">
                                            {selectedHouse?.doorNumber}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">Unit {selectedHouse?.doorNumber}</h3>
                                            {selectedHouse?.tenantName && (
                                                <p className="text-muted-foreground">{selectedHouse.tenantName}</p>
                                            )}
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Rent: KES {selectedHouse?.rentAmount.toLocaleString()} | Deposit: KES {selectedHouse?.depositAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        className={
                                            selectedHouse?.status === "occupied"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                        }
                                    >
                                        {selectedHouse?.status === "occupied" ? "Occupied" : "Vacant"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Card */}
                        {selectedHouse?.status === "vacant" ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        Add Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddTenant} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Tenant Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="tenant@example.com"
                                                value={tenantEmail}
                                                onChange={(e) => setTenantEmail(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                The tenant must have an existing account with this email
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Tenant Phone (Optional)</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="254712345678"
                                                value={tenantPhone}
                                                onChange={(e) => setTenantPhone(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Adding Tenant...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add Tenant
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserMinus className="h-5 w-5" />
                                        Remove Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        This will remove <strong>{selectedHouse?.tenantName}</strong> from Unit {selectedHouse?.doorNumber} and mark the house as vacant.
                                    </p>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={handleRemoveTenant}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Removing Tenant...
                                            </>
                                        ) : (
                                            <>
                                                <UserMinus className="mr-2 h-4 w-4" />
                                                Remove Tenant
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}