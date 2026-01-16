"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PopulatedHouseWithPayments, PaymentRecord } from "@/types/payments";

type Charge = {
    _id?: string;
    label: string;
    amount: number;
};

type AdditionalCharges = {
    water: number;
    electricity: number;
    other: Charge[];
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyHousePage() {
    const { data: session, status } = useSession();
    const [amount, setAmount] = useState<number>(0);
    const [houses, setHouses] = useState<PopulatedHouseWithPayments[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedPayments, setExpandedPayments] = useState<{ [key: string]: boolean }>({});
    const [phone, setPhone] = useState("");
    const [paymentLoading, setPaymentLoading] = useState(false);


    // Monthly payment states
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (status === "authenticated") {
            fetchTenantHouses();
        }
    }, [status]);

    const user = session?.user;
    const tenantId = user?.id;

    const fetchTenantHouses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/houses?tenantId=${tenantId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch houses");
            }

            const data = await response.json();
            setHouses(data.houses || []);

            // Fetch unpaid months for each house
            if (data.houses?.length > 0) {
                const house = data.houses[0];

                // Set default amount to rent
                setAmount(house.rentAmount);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load houses");
        } finally {
            setLoading(false);
        }
    };

    const formatHouseType = (houseType: string) => {
        return houseType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const calculateTotalCharges = (charges: AdditionalCharges): number => {
        const otherChargesTotal = charges.other.reduce(
            (sum, charge) => sum + charge.amount,
            0
        );
        return charges.electricity + charges.water + otherChargesTotal;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[status as keyof typeof statusColors] || statusColors.cancelled
            }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const togglePaymentHistory = (houseId: string) => {
        setExpandedPayments(prev => ({
            ...prev,
            [houseId]: !prev[houseId]
        }));
    };

    async function payMonthlyRent(house: PopulatedHouseWithPayments) {
        if (!phone) {
            alert("Please enter your M-PESA phone number");
            return;
        }


        // Filter out deposit from selected charges for monthly payments
        const monthlyCharges = house.additionalCharges.other
            .filter(charge => !charge.label.toLowerCase().includes('deposit'))
            .map(charge => ({
                id: `other-${charge._id}`,
                label: charge.label,
                amount: charge.amount
            }));

        // Add rent as required charge
        const selectedCharges = [
            { id: 'rent', label: 'Monthly Rent', amount: house.rentAmount },
            ...monthlyCharges
        ];

        setPaymentLoading(true);

        try {
            const response = await fetch("/api/payments/direct/stk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: phone,
                    amount: amount,
                    partyB: house.apartment.disbursementAccount.bankPaybill,
                    accountReference: house.apartment.disbursementAccount.bankAccountNumber,
                    transactionDesc: `Rent for ${MONTHS[selectedMonth - 1]} ${selectedYear} - House ${house.doorNumber}`,
                    transactionType: 'CustomerPayBillOnline',
                    apartmentId: house.apartment._id,
                    houseId: house._id,
                    selectedCharges,
                    paymentType: 'monthly',
                    paymentPeriod: {
                        month: selectedMonth,
                        year: selectedYear
                    }
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Payment initiated for ${MONTHS[selectedMonth - 1]} ${selectedYear}! ${result.message}`);
                fetchTenantHouses();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Payment failed");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Payment failed");
        } finally {
            // ✅ Stop loading
            setPaymentLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="grid gap-6 mt-6">
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">Loading your houses...</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid gap-6 mt-6">
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center text-red-600">Error: {error}</div>
                        <div className="text-center mt-4">
                            <Button onClick={fetchTenantHouses}>Retry</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-6 mt-6">
            {houses.length > 0 ? (
                houses.map((house) => (
                    <Card key={house._id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                            <CardTitle className="flex items-center justify-between">
                                <span>My House - {house.apartment.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        house.status === "occupied"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                    }`}>
                                        {house.status.charAt(0).toUpperCase() + house.status.slice(1)}
                                    </span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Property Details */}
                                <div className="lg:col-span-1">
                                    <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
                                        Property Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Apartment:</span>
                                            <span className="font-medium">{house.apartment.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Door Number:</span>
                                            <span className="font-medium">{house.doorNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">House Type:</span>
                                            <span className="font-medium">{formatHouseType(house.apartment.houseType)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                                KES {house.rentAmount?.toLocaleString() || "N/A"}
                                            </span>
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="font-semibold mb-3">Payment Summary</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                                                    <span className="font-medium text-green-600">
                                                        KES {house.paymentDetails.totalAmountPaid.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Last Payment:</span>
                                                    <span className="font-medium">
                                                        {house.paymentDetails.lastPaymentDate
                                                            ? formatDate(house.paymentDetails.lastPaymentDate)
                                                            : "Never"
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Additional Charges */}
                                <div className="lg:col-span-1">
                                    <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
                                        Additional Charges
                                    </h3>
                                    <div className="space-y-3">
                                        {house.additionalCharges.electricity > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Electricity:</span>
                                                <span className="font-medium">
                                                    KES {house.additionalCharges.electricity.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {house.additionalCharges.water > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Water:</span>
                                                <span className="font-medium">
                                                    KES {house.additionalCharges.water.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {house.additionalCharges.other.map((charge) => (
                                            <div key={charge._id} className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">{charge.label}:</span>
                                                <span className="font-medium">
                                                    KES {charge.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                        {(house.additionalCharges.electricity > 0 ||
                                            house.additionalCharges.water > 0 ||
                                            house.additionalCharges.other.length > 0) && (
                                            <div className="border-t pt-3 mt-3">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-gray-900 dark:text-gray-100">Total Additional:</span>
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        KES {calculateTotalCharges(house.additionalCharges).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Monthly Payment Section */}
                                <div className="lg:col-span-1">
                                    <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
                                        Pay Monthly Rent
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Month/Year Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Select Month/Year
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                >
                                                    {MONTHS.map((month, idx) => (
                                                        <option key={idx} value={idx + 1}>
                                                            {month}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                >
                                                    {[2024, 2025, 2026].map(year => (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Payment Amount (KES)
                                            </label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter amount"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <button
                                                onClick={() => setAmount(house.rentAmount)}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                Rent: {house.rentAmount.toLocaleString()}
                                            </button>
                                            <button
                                                onClick={() => setAmount(
                                                    house.rentAmount + calculateTotalCharges(house.additionalCharges)
                                                )}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                Total: {(house.rentAmount + calculateTotalCharges(house.additionalCharges)).toLocaleString()}
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                M-PESA Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0712345678"
                                            />
                                        </div>

                                        <Button
                                            onClick={() => payMonthlyRent(house)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                            size="lg"
                                            disabled={paymentLoading}
                                        >
                                            {paymentLoading ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-5 w-5 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8v8H4z"
                                                        ></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                "Pay Rent"
                                            )}
                                        </Button>


                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                            You will receive an M-PESA prompt on your phone
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        Payment History ({house.paymentDetails.totalPayments})
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => togglePaymentHistory(house._id)}
                                    >
                                        {expandedPayments[house._id] ? 'Hide' : 'Show'} History
                                    </Button>
                                </div>

                                {expandedPayments[house._id] && (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <THead>
                                                <TR className="border-b border-gray-200 dark:border-gray-700">
                                                    <TH className="text-left font-medium">Date</TH>
                                                    <TH className="text-left font-medium">Period</TH>
                                                    <TH className="text-left font-medium">Type</TH>
                                                    <TH className="text-left font-medium">Charges</TH>
                                                    <TH className="text-right font-medium">Amount</TH>
                                                    <TH className="text-center font-medium">Status</TH>
                                                    <TH className="text-center font-medium">Receipt</TH>
                                                </TR>
                                            </THead>
                                            <TBody>
                                                {house.paymentDetails.paymentHistory.map((payment: PaymentRecord) => (
                                                    <TR key={payment._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <TD className="font-medium text-sm">
                                                            {formatTime(payment.createdAt)}
                                                        </TD>
                                                        <TD className="text-sm">
                                                            {payment.paymentPeriod ? (
                                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded text-xs">
                                                                    {MONTHS[payment.paymentPeriod.month - 1]} {payment.paymentPeriod.year}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">Joining</span>
                                                            )}
                                                        </TD>
                                                        <TD className="text-sm">
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                payment.paymentType === 'monthly'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                                                            }`}>
                                                                {payment.paymentType}
                                                            </span>
                                                        </TD>
                                                        <TD className="text-sm">
                                                            <div className="space-y-1">
                                                                {payment.selectedCharges.map((charge, idx) => (
                                                                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {charge.label}: KES {charge.amount.toLocaleString()}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TD>
                                                        <TD className="text-right font-medium">
                                                            KES {payment.totalAmount.toLocaleString()}
                                                        </TD>
                                                        <TD className="text-center">
                                                            {getStatusBadge(payment.status)}
                                                        </TD>
                                                        <TD className="text-center">
                                                            {payment.mpesaReceiptNumber ? (
                                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                                                    {payment.mpesaReceiptNumber}
                                                                </code>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                        </TD>
                                                    </TR>
                                                ))}
                                            </TBody>
                                        </Table>
                                        {house.paymentDetails.paymentHistory.length === 0 && (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                No payment history yet
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Occupancy Timeline */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>Move-in Date: {formatDate(house.createdAt)}</span>
                                    <span>Last Updated: {formatDate(house.updatedAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card>
                    <CardContent>
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                You havent rented any House
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                You haven&apos;t joined any apartment yet. Start your search to find the perfect home.
                            </p>
                            <Link href="/join-apartment">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Find a Vacant House
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}