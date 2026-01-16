
// types/mpesa.ts

export interface MpesaCallbackItem {
  Name:
    | "Amount"
    | "MpesaReceiptNumber"
    | "Balance"
    | "TransactionDate"
    | "PhoneNumber"
    | string; // fallback for unexpected values
  Value?: string | number;
}

export interface MpesaCallbackMetadata {
  Item: MpesaCallbackItem[];
}

export interface MpesaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: MpesaCallbackMetadata;
}

export interface MpesaCallbackBody {
  Body: {
    stkCallback: MpesaStkCallback;
  };
}
