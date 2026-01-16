"use client"

import { useApartment } from "@/hooks/use-apartment-context"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserMinus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface House {
    _id: string
    doorNumber: string
    status: "occupied" | "vacant"
    tenantName?: string
    rentAmount: number
}

interface HousesData {
    apartmentName: string
    units: House[]
    summary: {
        total: number
        occupied: number
        vacant: number
        occupancyRate: number
    }
}

export default function HousesPage() {
    const router = useRouter()
    const { apartment } = useApartment()
    const [filter, setFilter] = useState<"all" | "occupied" | "vacant">("all")
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const { data, isLoading, error } = useSWR<HousesData>(
        apartment.apartmentId ? `/api/apartments/${apartment.apartmentId}/units` : null,
        fetcher,
    )

    const handleManageTenant = (houseId: string) => {
        router.push(`/dashboard/add-remove?houseId=${houseId}`)
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
            <main className="w-screen dotted-bg p-6">
                <div className="max-w-6xl mx-auto space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`h-24 bg-muted rounded ${isClient ? "animate-pulse" : ""}`}></div>
                    ))}
                </div>
            </main>
        )
    }

    if (error || !data || !data.units) {
        return (
            <main className="w-screen dotted-bg p-6">
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">
                                {error ? "Failed to load houses" : "No data available"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    const filtered = data.units.filter((house) => {
        if (filter === "all") return true
        return house.status === filter
    })

    return (
        <main className="w-screen dotted-bg p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{data.apartmentName} - Houses</h1>
                        <p className="text-muted-foreground mt-2">
                            {data.summary.occupied} occupied • {data.summary.vacant} vacant • {data.summary.total} total
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {(["all", "occupied", "vacant"] as const).map((f) => (
                            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                                {f === "all" ? "All" : f === "occupied" ? "Occupied" : "Vacant"} (
                                {f === "all" ? data.summary.total : f === "occupied" ? data.summary.occupied : data.summary.vacant})
                            </Button>
                        ))}
                    </div>
                </div>

                {/* House Cards */}
                <div className="grid gap-4">
                    {filtered.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground">No houses found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filtered.map((house) => (
                            <Card key={house._id} className="hover:shadow-md transition-shadow border">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-lg text-purple-600 dark:text-purple-400">
                                                {house.doorNumber}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">Unit {house.doorNumber}</h3>
                                                {house.tenantName && <p className="text-sm text-muted-foreground">{house.tenantName}</p>}
                                                <Badge
                                                    className={`mt-2 ${
                                                        house.status === "occupied"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {house.status === "occupied" ? "Occupied" : "Vacant"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                                <p className="text-2xl font-bold text-purple-600">KES {house.rentAmount.toLocaleString()}</p>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                variant={house.status === "vacant" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleManageTenant(house._id)}
                                                className="whitespace-nowrap"
                                            >
                                                {house.status === "vacant" ? (
                                                    <>
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Add Tenant
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                        Remove Tenant
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
}