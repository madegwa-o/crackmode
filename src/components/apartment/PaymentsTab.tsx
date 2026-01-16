"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Payment {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    transactionDate: string;
    selectedCharges: Array<{ id: string; label: string; amount: number }>;
    mpesaReceiptNumber: string | null;
    phoneNumber: string;
}

interface TenantPayment {
    _id: string;
    doorNumber: string;
    tenant: {
        name: string;
        email: string;
        phone: string | null;
    } | null;
    hasPaid: boolean;
    totalPaid: number;
    paymentCount: number;
    payments: Payment[];
}

interface PaymentsData {
    apartmentName: string;
    filterPeriod: {
        month: number;
        year: number;
        monthName: string;
    };
    tenantPayments: TenantPayment[];
    summary: {
        total: number;
        paid: number;
        unpaid: number;
        totalCollected: number;
    };
}

interface PaymentsTabProps {
    apartmentId: string;
}

export default function PaymentsTab({ apartmentId }: PaymentsTabProps) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null);

    const { data, error, isLoading } = useSWR<PaymentsData>(
        apartmentId
            ? `/api/apartments/${apartmentId}/payments?month=${selectedMonth}&year=${selectedYear}`
            : null,
        fetcher
    );

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentStatusBadge = (status: string) => {
        const colors = {
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                colors[status as keyof typeof colors] || colors.cancelled
            }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Generate month and year options
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const currentYear = now.getFullYear();
    const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Failed to load payments data</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="mt-4"
                    >
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Payment Tracking - {data.filterPeriod.monthName} {data.filterPeriod.year}</CardTitle>
                        <div className="flex gap-4 text-sm mt-2">
                            <span className="text-green-600">{data.summary.paid} paid</span>
                            <span className="text-red-600">{data.summary.unpaid} unpaid</span>
                            <span className="text-muted-foreground">
                                Total: KES {data.summary.totalCollected.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(val) => setSelectedMonth(parseInt(val))}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(val) => setSelectedYear(parseInt(val))}
                        >
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {data.tenantPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">No tenants in this property</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.tenantPayments.map((tenantPayment) => (
                            <Card
                                key={tenantPayment._id}
                                className={`border shadow-sm ${
                                    !tenantPayment.hasPaid ? 'border-red-200 dark:border-red-900' : ''
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">Unit {tenantPayment.doorNumber}</h3>
                                                    <Badge
                                                        className={tenantPayment.hasPaid
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }
                                                    >
                                                        {tenantPayment.hasPaid ? 'Paid' : 'Unpaid'}
                                                    </Badge>
                                                </div>
                                                {tenantPayment.tenant && (
                                                    <div className="space-y-1">
                                                        <p className="font-medium">{tenantPayment.tenant.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {tenantPayment.tenant.email}
                                                        </p>
                                                        {tenantPayment.tenant.phone && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {tenantPayment.tenant.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Summary */}
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600 text-lg">
                                                    KES {tenantPayment.totalPaid.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {tenantPayment.paymentCount} payment{tenantPayment.paymentCount !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Details Toggle */}
                                        {tenantPayment.payments.length > 0 && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setExpandedTenant(
                                                        expandedTenant === tenantPayment._id ? null : tenantPayment._id
                                                    )}
                                                    className="w-full"
                                                >
                                                    {expandedTenant === tenantPayment._id ? 'Hide' : 'Show'} Payment Details
                                                </Button>

                                                {expandedTenant === tenantPayment._id && (
                                                    <div className="pt-4 border-t">
                                                        <h4 className="font-medium mb-3 text-sm">Payments This Month</h4>
                                                        <div className="space-y-3">
                                                            {tenantPayment.payments.map((payment) => (
                                                                <div
                                                                    key={payment._id}
                                                                    className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-medium text-sm">
                                                                                {formatDateTime(payment.transactionDate)}
                                                                            </span>
                                                                            {getPaymentStatusBadge(payment.status)}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                                            {payment.selectedCharges.map((charge, idx) => (
                                                                                <div key={idx}>
                                                                                    {charge.label}: KES {charge.amount.toLocaleString()}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {payment.mpesaReceiptNumber && (
                                                                            <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                                                                                {payment.mpesaReceiptNumber}
                                                                            </code>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-semibold text-green-600">
                                                                            KES {payment.totalAmount.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!tenantPayment.hasPaid && tenantPayment.payments.length === 0 && (
                                            <div className="text-center py-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    No payments recorded for {data.filterPeriod.monthName}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}