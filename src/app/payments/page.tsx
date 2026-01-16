"use client"

import { useApartment } from "@/hooks/use-apartment-context"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MonthlyPayment {
    _id: string
    doorNumber: string
    tenant: { name: string }
    hasPaid: boolean
    totalPaid: number
    payments: Array<{
        _id: string
        totalAmount: number
        status: string
        createdAt: string
    }>
}

interface PaymentsData {
    apartmentName: string
    filterPeriod: {
        month: number
        year: number
        monthName: string
    }
    tenantPayments: MonthlyPayment[]
    summary: {
        total: number
        paid: number
        unpaid: number
        totalCollected: number
    }
}

export default function PaymentsPage() {
    const { apartment } = useApartment()
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const { data, isLoading, error } = useSWR<PaymentsData>(
        apartment.apartmentId
            ? `/api/apartments/${apartment.apartmentId}/payments?month=${selectedMonth}&year=${selectedYear}`
            : null,
        fetcher,
    )

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ]

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

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
                            <p className="text-muted-foreground">Failed to load payments</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="w-screen dotted-bg p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header with Month/Year Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Payment Tracking</h1>
                        <p className="text-muted-foreground mt-2">
                            {data.filterPeriod.monthName} {data.filterPeriod.year}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(Number.parseInt(val))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(Number.parseInt(val))}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">Paid</p>
                            <p className="text-3xl font-bold text-green-600">{data.summary.paid}</p>
                            <p className="text-xs text-muted-foreground mt-1">units paid</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">Unpaid</p>
                            <p className="text-3xl font-bold text-red-600">{data.summary.unpaid}</p>
                            <p className="text-xs text-muted-foreground mt-1">units unpaid</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900">
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">Collected</p>
                            <p className="text-3xl font-bold text-purple-600">KES {data.summary.totalCollected.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">total collected</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Payment Cards - Color Coded */}
                <div className="grid gap-3">
                    {data.tenantPayments.map((payment) => (
                        <Card
                            key={payment._id}
                            className={`border-2 transition-all cursor-pointer ${
                                payment.hasPaid
                                    ? "border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800 hover:shadow-md hover:shadow-green-200/50"
                                    : "border-red-300 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800 hover:shadow-md hover:shadow-red-200/50"
                            }`}
                            onClick={() => setExpandedUnit(expandedUnit === payment._id ? null : payment._id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${payment.hasPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                                            <h3 className="font-semibold text-lg">Unit {payment.doorNumber}</h3>
                                            <Badge
                                                className={`${
                                                    payment.hasPaid
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                                }`}
                                            >
                                                {payment.hasPaid ? "✓ Paid" : "✗ Unpaid"}
                                            </Badge>
                                        </div>
                                        <p className="font-medium text-sm">{payment.tenant.name}</p>
                                    </div>

                                    <div className="text-right flex items-end justify-between sm:justify-end gap-4">
                                        <div>
                                            <p className={`text-3xl font-bold ${payment.hasPaid ? "text-green-600" : "text-red-600"}`}>
                                                KES {payment.totalPaid.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {payment.payments.length} transaction
                                                {payment.payments.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            className={`h-5 w-5 text-muted-foreground transition-transform ${
                                                expandedUnit === payment._id ? "rotate-180" : ""
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Transaction Details - Expandable */}
                                {expandedUnit === payment._id && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        {payment.payments.length > 0 ? (
                                            <>
                                                <h4 className="font-medium text-sm">Transaction Details</h4>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {payment.payments.map((txn) => (
                                                        <div
                                                            key={txn._id}
                                                            className="flex justify-between items-start p-3 bg-background rounded-lg border"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium">{new Date(txn.createdAt).toLocaleDateString()}</p>
                                                                <Badge variant="outline" className="mt-1 text-xs">
                                                                    {txn.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="font-semibold text-green-600">KES {txn.totalAmount.toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-red-600 font-medium">
                                                    No payments recorded for {data.filterPeriod.monthName}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
