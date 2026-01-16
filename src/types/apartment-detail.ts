// types/apartment-detail.ts

interface PaymentRecord {
    _id: string;
    merchantRequestId: string;
    checkoutRequestId: string;
    totalAmount: number;
    phoneNumber: string;
    selectedCharges: Array<{
        id: string;
        label: string;
        amount: number;
    }>;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    mpesaReceiptNumber?: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
    tenant: {
        _id: string;
        name: string;
        email: string;
    };
}

interface PaymentSummary {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    totalAmountPaid: number;
    pendingAmount: number;
    lastPayment: PaymentRecord | null;
    recentPayments: PaymentRecord[];
    rentStatus: 'paid' | 'pending' | 'overdue';
    currentMonthPaid: boolean;
    currentMonthAmount: number;
}

interface Tenant {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

interface HouseWithPaymentDetails {
    _id: string;
    doorNumber: string;
    status: 'vacant' | 'occupied';
    apartment: string;
    tenant?: Tenant;
    createdAt: string;
    updatedAt: string;
    paymentSummary: PaymentSummary;
}

interface ApartmentAnalytics {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    potentialMonthlyIncome: number;
    currentMonthIncome: number;
    collectionRate: number;
    totalCollected: number;
    paidRentCount: number;
    pendingRentCount: number;
    overdueRentCount: number;
    averagePaymentAmount: number;
}

interface ApartmentDetail {
    _id: string;
    name: string;
    houseType: string;
    rentAmount: number;
    depositAmount?: number;
    numberOfDoors: number;
    withDeposit: boolean;
    landlordPhoneNumber: string;
    additionalCharges: {
        electricity: number;
        water: number;
        other: Array<{
            _id: string;
            label: string;
            amount: number;
        }>;
    };
    disbursementAccount: {
        type: 'bank' | 'safaricom';
        bankPaybill?: string;
        bankAccountNumber?: string;
        safaricomNumber?: string;
    };
    landlord: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface ApartmentDetailResponse {
    apartment: ApartmentDetail;
    houses: HouseWithPaymentDetails[];
    analytics: ApartmentAnalytics;
    summary: {
        totalUnits: number;
        occupied: number;
        vacant: number;
        monthlyIncome: number;
        totalCollected: number;
    };
}

export type {
    PaymentRecord,
    PaymentSummary,
    Tenant,
    HouseWithPaymentDetails,
    ApartmentAnalytics,
    ApartmentDetail,
    ApartmentDetailResponse
};