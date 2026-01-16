// helpers/mpesa.ts


interface MpesaConfig {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
    callbackUrl: string;
    baseUrl: string;
}

interface PaymentData {
    phoneNumber: string;
    partyB: number;
    amount: number;
    accountReference?: string;
    transactionDesc?: string;
    transactionType?: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
}

interface ValidatedPaymentData {
    phoneNumber: string;
    amount: number;
    partyB: number;
    accountReference: string;
    transactionDesc: string;
    transactionType?: string;
}

interface STKPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

interface AccessTokenResponse {
    access_token: string;
    expires_in: string;
}

interface PasswordData {
    password: string;
    timestamp: string;
}

/**
 * Get M-Pesa configuration from environment variables
 */
export function getMpesaConfig(): MpesaConfig {
    const config: MpesaConfig = {
        consumerKey: process.env.MPESA_CONSUMER_KEY || '',
        consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
        shortCode: process.env.MPESA_SHORT_CODE || '',
        passkey: process.env.MPESA_PASSKEY || '',
        callbackUrl: `${process.env.MPESA_CALLBACK_BASE_URL}/api/payments/direct/callback`,
        baseUrl:  'https://api.safaricom.co.ke',
    };

    // Validate required configuration
    const requiredFields: (keyof MpesaConfig)[] = ['consumerKey', 'consumerSecret', 'shortCode', 'passkey'];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing M-Pesa configuration: ${missingFields.join(', ')}`);
    }

    return config;
}

/**
 * Generate M-Pesa access token
 */
export async function generateAccessToken(config: MpesaConfig): Promise<string> {
    try {
        const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

        const response = await fetch(
            `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data: AccessTokenResponse = await response.json();

        if (!data.access_token) {
            throw new Error('No access token received from M-Pesa API');
        }

        return data.access_token;
    } catch (error) {
        console.error('Error generating access token:', error);
        throw new Error(`Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate password for STK push
 */
export function generatePassword(config: MpesaConfig): PasswordData {
    const now = new Date();

    // Format timestamp as YYYYMMDDHHmmss
    const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');

    const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString('base64');

    return { password, timestamp };
}

/**
 * Validate phone number format and convert to international format
 */
export function validatePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) {
        throw new Error('Phone number is required');
    }

    // Remove any spaces, dashes, or plus signs
    const cleaned = phoneNumber.replace(/[\s\-\+]/g, '');

    // Check if it starts with 254 (Kenya country code)
    if (cleaned.startsWith('254') && cleaned.length === 12) {
        return cleaned;
    }

    // Check if it starts with 0 (local format)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return '254' + cleaned.substring(1);
    }

    // Check if it's 9 digits (without leading 0 or country code)
    if (cleaned.length === 9) {
        return '254' + cleaned;
    }

    throw new Error('Invalid phone number format. Use 254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX');
}

/**
 * Validate and sanitize payment data
 */
export function validatePaymentData(data: PaymentData): ValidatedPaymentData {
    const { phoneNumber, amount, accountReference, transactionDesc, transactionType, partyB } = data;

    // Validate phone number
    const validatedPhoneNumber = validatePhoneNumber(phoneNumber);

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number greater than 0');
    }

    console.log('data: ', data);


    return {
        phoneNumber: validatedPhoneNumber,
        amount: Math.round(amount), // M-Pesa only supports whole numbers
        partyB: partyB,
        accountReference: accountReference || 'Payment',
        transactionDesc: transactionDesc || 'Payment',
        transactionType: transactionType || 'CustomerPayBillOnline',
    };
}

/**
 * Create STK push payload
 */
export function createSTKPushPayload(
    config: MpesaConfig,
    paymentData: ValidatedPaymentData,
    passwordData: PasswordData
) {
    return {
        BusinessShortCode: config.shortCode,
        Password: passwordData.password,
        Timestamp: passwordData.timestamp,
        TransactionType: paymentData.transactionType,
        Amount: paymentData.amount,
        PartyA: paymentData.phoneNumber,
        PartyB: paymentData.partyB,
        PhoneNumber: paymentData.phoneNumber,
        CallBackURL: config.callbackUrl,
        AccountReference: paymentData.accountReference,
        TransactionDesc: paymentData.transactionDesc,
    };
}

/**
 * Initiate STK Push request
 */
export async function initiateSTKPush(
    config: MpesaConfig,
    accessToken: string,
    paymentData: ValidatedPaymentData
): Promise<STKPushResponse> {
    try {
        const passwordData = generatePassword(config);
        const stkPushPayload = createSTKPushPayload(config, paymentData, passwordData);

        console.log('stk push payload: ', stkPushPayload);

        const response = await fetch(
            `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stkPushPayload),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data: STKPushResponse = await response.json();

        // Validate response structure
        if (!data.MerchantRequestID || !data.CheckoutRequestID) {
            throw new Error('Invalid response from M-Pesa API');
        }

        return data;
    } catch (error) {
        console.error('Error initiating STK push:', error);
        throw new Error(`Failed to initiate STK push: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Complete STK push process (generate token + initiate push)
 */
export async function processSTKPush(paymentData: PaymentData): Promise<STKPushResponse> {
    try {
        // Get configuration
        const config = getMpesaConfig();

        // Validate payment data
        const validatedData = validatePaymentData(paymentData);


        // Generate access token
        const accessToken = await generateAccessToken(config);

        // Initiate STK push
        const response = await initiateSTKPush(config, accessToken, validatedData);

        return response;
    } catch (error) {
        console.error('Error processing STK push:', error);
        throw error;
    }
}

/**
 * Format STK push response for API
 */
export function formatSTKPushResponse(response: STKPushResponse) {
    return {
        success: true,
        message: 'STK push initiated successfully',
        data: {
            merchantRequestId: response.MerchantRequestID,
            checkoutRequestId: response.CheckoutRequestID,
            responseCode: response.ResponseCode,
            responseDescription: response.ResponseDescription,
            customerMessage: response.CustomerMessage,
        },
    };
}

/**
 * Check if M-Pesa environment is configured
 */
export function isMpesaConfigured(): boolean {
    try {
        getMpesaConfig();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get user-friendly error message for M-Pesa errors
 */
export function getMpesaErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('phone number')) {
        return 'Please provide a valid Kenyan phone number (e.g., 0712345678 or 254712345678)';
    }

    if (message.includes('amount')) {
        return 'Please provide a valid amount greater than 0';
    }

    if (message.includes('access token')) {
        return 'Unable to authenticate with M-Pesa. Please try again later';
    }

    if (message.includes('configuration') || message.includes('credentials')) {
        return 'M-Pesa service is currently unavailable. Please try again later';
    }

    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error occurred. Please check your connection and try again';
    }

    return error.message || 'An unexpected error occurred. Please try again';
}

// Export types for use in other files
export type {
    MpesaConfig,
    PaymentData,
    ValidatedPaymentData,
    STKPushResponse,
    AccessTokenResponse,
    PasswordData,
};