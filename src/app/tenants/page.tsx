"use client"

import { useApartment } from "@/hooks/use-apartment-context"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Tenant {
    _id: string
    doorNumber: string
    tenant: {
        name: string
        email: string
        phone?: string
    }
    paymentSummary: {
        rentStatus: "paid" | "pending" | "overdue"
        currentMonthPaid: boolean
        currentMonthAmount: number
        totalAmountPaid: number
        completedPayments: number
        recentPayments: Array<{
            _id: string
            totalAmount: number
            status: string
            createdAt: string
            selectedCharges: Array<{ label: string; amount: number }>
        }>
    }
}

interface TenantsData {
    apartmentName: string
    tenants: Tenant[]
    summary: {
        total: number
        paidRent: number
        pendingRent: number
        overdueRent: number
    }
}

export default function TenantsPage() {
    const { apartment } = useApartment()
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const { data, isLoading, error } = useSWR<TenantsData>(
        apartment.apartmentId ? `/api/apartments/${apartment.apartmentId}/tenants` : null,
        fetcher,
    )

    const getRentStatusBadge = (status: "paid" | "pending" | "overdue") => {
        const config = {
            paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        }
        return <Badge className={config[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    }

    const getPaymentStatusBadge = (status: string) => {
        const config = {
            completed: {
                className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                label: "Completed"
            },
            pending: {
                className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                label: "Pending"
            },
            failed: {
                className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                label: "Failed"
            },
            cancelled: {
                className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
                label: "Cancelled"
            }
        }

        const statusConfig = config[status as keyof typeof config] || config.pending
        return <Badge className={`${statusConfig.className} text-xs`}>{statusConfig.label}</Badge>
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
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`h-32 bg-muted rounded ${isClient ? "animate-pulse" : ""}`}></div>
                    ))}
                </div>
            </main>
        )
    }

    if (error || !data) {
        return (
            <main className="w-screen dotted-bg p-6">
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">Failed to load tenants</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="w-screen dotted-bg p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header with Summary */}
                <div>
                    <h1 className="text-3xl font-bold">Tenants</h1>
                    <div className="flex flex-wrap gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-muted-foreground">
                <span className="font-semibold text-green-600">{data.summary.paidRent}</span> Paid
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-muted-foreground">
                <span className="font-semibold text-yellow-600">{data.summary.pendingRent}</span> Pending
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-muted-foreground">
                <span className="font-semibold text-red-600">{data.summary.overdueRent}</span> Overdue
              </span>
                        </div>
                    </div>
                </div>

                {/* Tenant Cards */}
                <div className="grid gap-4">
                    {data.tenants.map((tenant) => (
                        <Card key={tenant._id} className="hover:shadow-md transition-shadow cursor-pointer border">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">Unit {tenant.doorNumber}</h3>
                                                {getRentStatusBadge(tenant.paymentSummary.rentStatus)}
                                            </div>
                                            <p className="font-medium">{tenant.tenant.name}</p>
                                            <p className="text-sm text-muted-foreground">{tenant.tenant.email}</p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedTenant(expandedTenant === tenant._id ? null : tenant._id)}
                                            className="self-end sm:self-auto"
                                        >
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${expandedTenant === tenant._id ? "rotate-180" : ""}`}
                                            />
                                            History
                                        </Button>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                                            <p className="font-semibold text-green-600">
                                                KES {tenant.paymentSummary.totalAmountPaid.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground mb-1">This Month</p>
                                            <p
                                                className={`font-semibold ${
                                                    tenant.paymentSummary.currentMonthPaid ? "text-green-600" : "text-red-600"
                                                }`}
                                            >
                                                {tenant.paymentSummary.currentMonthPaid
                                                    ? `KES ${tenant.paymentSummary.currentMonthAmount.toLocaleString()}`
                                                    : "Not Paid"}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground mb-1">Payments Count</p>
                                            <p className="font-semibold">{tenant.paymentSummary.completedPayments}</p>
                                        </div>
                                    </div>

                                    {/* Payment History - Expandable */}
                                    {expandedTenant === tenant._id && (
                                        <div className="pt-4 border-t space-y-3">
                                            <h4 className="font-medium text-sm">Payment History</h4>
                                            {tenant.paymentSummary.recentPayments.length > 0 ? (
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {tenant.paymentSummary.recentPayments.map((payment) => (
                                                        <div key={payment._id} className="p-3 bg-muted rounded-lg text-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                                                    {getPaymentStatusBadge(payment.status)}
                                                                </div>
                                                                <p className={`font-semibold ${
                                                                    payment.status === 'completed' ? 'text-green-600' :
                                                                        payment.status === 'failed' ? 'text-red-600' :
                                                                            'text-muted-foreground'
                                                                }`}>
                                                                    KES {payment.totalAmount.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {payment.selectedCharges.map((c) => c.label).join(", ")}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">No payment history available</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}