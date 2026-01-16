"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PaymentRecord {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    selectedCharges: Array<{ id: string; label: string; amount: number }>;
    mpesaReceiptNumber: string | null;
}

interface Tenant {
    _id: string;
    doorNumber: string;
    tenant: {
        name: string;
        email: string;
        phone: string | null;
    };
    occupiedSince: string;
    paymentSummary: {
        totalPayments: number;
        completedPayments: number;
        pendingPayments: number;
        failedPayments: number;
        totalAmountPaid: number;
        pendingAmount: number;
        lastPaymentDate: string | null;
        rentStatus: 'paid' | 'pending' | 'overdue';
        currentMonthPaid: boolean;
        currentMonthAmount: number;
        recentPayments: PaymentRecord[];
    };
}

interface TenantsData {
    apartmentName: string;
    tenants: Tenant[];
    summary: {
        total: number;
        paidRent: number;
        pendingRent: number;
        overdueRent: number;
    };
}

interface TenantsTabProps {
    apartmentId: string;
}

export default function TenantsTab({ apartmentId }: TenantsTabProps) {
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null);

    const { data, error, isLoading } = useSWR<TenantsData>(
        apartmentId ? `/api/apartments/${apartmentId}/tenants` : null,
        fetcher
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRentStatusBadge = (status: 'paid' | 'pending' | 'overdue') => {
        const config = {
            paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
        return (
            <Badge className={config[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
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
                    <p className="text-muted-foreground">Failed to load tenants data</p>
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

    if (data.tenants.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-lg text-muted-foreground">No active tenants yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Tenants will appear here once they join your property
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Tenants ({data.summary.total})</CardTitle>
                <div className="flex gap-4 text-sm mt-2">
                    <span className="text-green-600">{data.summary.paidRent} paid</span>
                    <span className="text-yellow-600">{data.summary.pendingRent} pending</span>
                    <span className="text-red-600">{data.summary.overdueRent} overdue</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.tenants.map((tenant) => (
                        <Card key={tenant._id} className="border shadow-sm">
                            <CardContent className="p-4">
                                {/* Main Tenant Info */}
                                <div className="flex flex-col gap-4">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">Unit {tenant.doorNumber}</h3>
                                                {getRentStatusBadge(tenant.paymentSummary.rentStatus)}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">{tenant.tenant.name}</p>
                                                <p className="text-sm text-muted-foreground">{tenant.tenant.email}</p>
                                                {tenant.tenant.phone && (
                                                    <p className="text-sm text-muted-foreground">{tenant.tenant.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setExpandedTenant(
                                                    expandedTenant === tenant._id ? null : tenant._id
                                                )}
                                            >
                                                {expandedTenant === tenant._id ? 'Hide' : 'History'}
                                            </Button>
                                            {tenant.paymentSummary.rentStatus === 'overdue' && (
                                                <Button variant="outline" size="sm">
                                                    Remind
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Paid</p>
                                            <p className="font-semibold text-green-600">
                                                KES {tenant.paymentSummary.totalAmountPaid.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">This Month</p>
                                            <p className="font-semibold">
                                                {tenant.paymentSummary.currentMonthPaid ? (
                                                    <span className="text-green-600">
                                                        KES {tenant.paymentSummary.currentMonthAmount.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600">Not paid</span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Payments</p>
                                            <p className="font-semibold">
                                                {tenant.paymentSummary.completedPayments} completed
                                            </p>
                                            {tenant.paymentSummary.pendingPayments > 0 && (
                                                <p className="text-xs text-yellow-600">
                                                    {tenant.paymentSummary.pendingPayments} pending
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Last Payment</p>
                                            <p className="font-semibold">
                                                {tenant.paymentSummary.lastPaymentDate
                                                    ? formatDate(tenant.paymentSummary.lastPaymentDate)
                                                    : 'Never'
                                                }
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Since {formatDate(tenant.occupiedSince)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment History (Expandable) */}
                                    {expandedTenant === tenant._id && (
                                        <div className="pt-4 border-t">
                                            <h4 className="font-medium mb-3">Payment History</h4>
                                            {tenant.paymentSummary.recentPayments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {tenant.paymentSummary.recentPayments.map((payment) => (
                                                        <div
                                                            key={payment._id}
                                                            className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-sm">
                                                                        {formatDateTime(payment.createdAt)}
                                                                    </span>
                                                                    {getPaymentStatusBadge(payment.status)}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {payment.selectedCharges.map(c => c.label).join(', ')}
                                                                </div>
                                                                {payment.mpesaReceiptNumber && (
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        Receipt: {payment.mpesaReceiptNumber}
                                                                    </div>
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
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No payment history yet
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}