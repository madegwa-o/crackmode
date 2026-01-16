// types/tenant.ts (updated with house-specific charges)

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
}

interface PaymentDetails {
    latestPayment: PaymentRecord | null;
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    totalAmountPaid: number;
    paymentHistory: PaymentRecord[];
    lastPaymentDate: string | null;
    lastPaymentStatus: string | null;
    lastPaymentAmount: number;
    pendingAmount: number;
}

interface AdditionalCharges {
    electricity: number;
    water: number;
    other: Array<{
        label: string;
        amount: number;
        _id: string;
    }>;
}

interface DisbursementAccount {
    bankAccountNumber: string;
    bankPaybill: string;
    safaricomNumber: string;
    type: "bank" | "safaricom";
}

interface PopulatedHouseWithPayments {
    _id: string;
    doorNumber: string;
    status: "vacant" | "occupied";
    tenant: string;
    // House-specific financial fields
    rentAmount: number;
    depositAmount: number;
    additionalCharges: AdditionalCharges;
    // Timestamps
    createdAt: string;
    updatedAt: string;
    // Apartment details (for reference)
    apartment: {
        _id: string;
        name: string;
        houseType: string;
        // Apartment-level defaults (may differ from house values)
        rentAmount: number;
        depositAmount?: number;
        withDeposit: boolean;
        landlord: string;
        landlordPhoneNumber: string;
        additionalCharges: AdditionalCharges;
        disbursementAccount: DisbursementAccount;
    };
    // Payment tracking
    paymentDetails: PaymentDetails;
}



// types/payments.ts

export interface PaymentPeriod {
    month: number; // 1-12
    year: number;  // e.g., 2025
}

interface PaymentRecord {
    _id: string;
    tenant: string;
    apartment: string;
    house: string;
    transactionDate: string;

    // STK Push fields
    merchantRequestId: string;
    checkoutRequestId: string;
    responseCode: string;
    responseDescription: string;
    customerMessage: string;
    totalAmount: number;
    phoneNumber: string;
    selectedCharges: Array<{
        id: string;
        label: string;
        amount: number;
    }>;

    // Callback fields
    resultCode?: number;
    resultDesc?: string;
    mpesaReceiptNumber?: string;
    transactionId?: string;
    transactionAmount?: number;
    balance?: string;

    // Monthly tracking
    paymentPeriod?: PaymentPeriod | null;
    paymentType: 'joining' | 'monthly';

    // Status
    status: 'pending' | 'completed' | 'failed' | 'cancelled';

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

interface PaymentDetails {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    totalAmountPaid: number;
    pendingAmount: number;
    lastPaymentDate: string | null;
    latestPayment: PaymentRecord | null;
    paymentHistory: PaymentRecord[];
}


interface UnpaidMonth {
    month: number;
    year: number;
}

interface UnpaidMonthsResponse {
    success: boolean;
    unpaidMonths: UnpaidMonth[];
    count: number;
}

interface PaymentStatusResponse {
    success: boolean;
    payment?: PaymentRecord;
    error?: string;
}

export type {
    PaymentRecord,
    PaymentDetails,
    PopulatedHouseWithPayments,
    AdditionalCharges,
    DisbursementAccount
};