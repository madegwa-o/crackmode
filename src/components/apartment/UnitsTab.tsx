"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Unit {
    _id: string;
    doorNumber: number;
    status: 'occupied' | 'vacant';
    tenantName: string | null;
    occupiedSince: string | null;
    rentAmount: number;
    depositAmount: number | null;
}

interface UnitsData {
    apartmentName: string;
    units: Unit[];
    summary: {
        total: number;
        occupied: number;
        vacant: number;
        occupancyRate: number;
    };
}

interface UnitsTabProps {
    apartmentId: string;
}

export default function UnitsTab({ apartmentId }: UnitsTabProps) {
    const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant'>('all');

    const { data, error, isLoading } = useSWR<UnitsData>(
        apartmentId ? `/api/apartments/${apartmentId}/units` : null,
        fetcher
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Failed to load units data</p>
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

    // Filter units based on selected filter
    const filteredUnits = data.units.filter(unit => {
        if (filter === 'all') return true;
        return unit.status === filter;
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Property Units ({data.summary.total})</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {data.summary.occupied} occupied • {data.summary.vacant} vacant • {data.summary.occupancyRate.toFixed(1)}% occupancy
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All ({data.summary.total})
                        </Button>
                        <Button
                            variant={filter === 'occupied' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('occupied')}
                        >
                            Occupied ({data.summary.occupied})
                        </Button>
                        <Button
                            variant={filter === 'vacant' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('vacant')}
                        >
                            Vacant ({data.summary.vacant})
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {filteredUnits.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No {filter !== 'all' && filter} units found
                        </div>
                    ) : (
                        filteredUnits.map((unit) => (
                            <Card key={unit._id} className="border shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        {/* Unit Number and Status */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 font-bold text-lg">
                                                {unit.doorNumber}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">Unit {unit.doorNumber}</h3>
                                                    <Badge
                                                        variant={unit.status === 'occupied' ? 'default' : 'secondary'}
                                                        className={unit.status === 'occupied'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                                        }
                                                    >
                                                        {unit.status === 'occupied' ? 'Occupied' : 'Vacant'}
                                                    </Badge>
                                                </div>
                                                {unit.status === 'occupied' && unit.tenantName && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Tenant: {unit.tenantName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unit Details */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs">Monthly Rent</p>
                                                <p className="font-semibold">
                                                    KES {unit.rentAmount}
                                                </p>
                                            </div>
                                            {unit.depositAmount && (
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Deposit</p>
                                                    <p className="font-semibold">
                                                        KES {unit.depositAmount.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                            {unit.status === 'occupied' && unit.occupiedSince && (
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Occupied Since</p>
                                                    <p className="font-semibold">
                                                        {formatDate(unit.occupiedSince)}
                                                    </p>
                                                </div>
                                            )}
                                            {unit.status === 'vacant' && (
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Status</p>
                                                    <p className="font-semibold text-green-600">
                                                        Available
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}