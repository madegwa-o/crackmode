// hooks/usePaymentPolling.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface PaymentStatus {
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    resultCode?: number;
    resultDesc?: string;
    mpesaReceiptNumber?: string;
    transactionAmount?: number;
}

interface PollingConfig {
    checkoutRequestId: string;
    maxAttempts?: number;
    baseInterval?: number;
    useExponentialBackoff?: boolean;
    onSuccess?: (data: PaymentStatus) => void;
    onFailure?: (data: PaymentStatus) => void;
    onTimeout?: () => void;
}

interface PollingResult {
    data: PaymentStatus | null;
    isPolling: boolean;
    error: string | null;
    attempts: number;
    stopPolling: () => void;
}

export function usePaymentPolling({
                                      checkoutRequestId,
                                      maxAttempts = 30,
                                      baseInterval = 2000,
                                      useExponentialBackoff = true,
                                      onSuccess,
                                      onFailure,
                                      onTimeout
                                  }: PollingConfig): PollingResult {
    const [data, setData] = useState<PaymentStatus | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasCalledCallbackRef = useRef(false);

    const calculateDelay = useCallback((attempt: number): number => {
        if (!useExponentialBackoff) return baseInterval;

        // Exponential backoff: 2s, 3s, 4s, 6s, 8s, 12s, 16s (capped at 16s)
        const exponentialDelay = Math.min(
            baseInterval * Math.pow(1.5, Math.floor(attempt / 3)),
            16000
        );
        return exponentialDelay;
    }, [baseInterval, useExponentialBackoff]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const checkStatus = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/payments/status?checkoutRequestId=${checkoutRequestId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.payment) {
                const paymentData: PaymentStatus = {
                    status: result.payment.status,
                    resultCode: result.payment.resultCode,
                    resultDesc: result.payment.resultDesc,
                    mpesaReceiptNumber: result.payment.mpesaReceiptNumber,
                    transactionAmount: result.payment.transactionAmount,
                };

                setData(paymentData);

                // Check if payment is no longer pending
                if (paymentData.status !== 'pending') {
                    stopPolling();

                    // Call appropriate callback only once
                    if (!hasCalledCallbackRef.current) {
                        hasCalledCallbackRef.current = true;

                        if (paymentData.status === 'completed' && onSuccess) {
                            onSuccess(paymentData);
                        } else if (paymentData.status === 'failed' && onFailure) {
                            onFailure(paymentData);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Payment status check error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, [checkoutRequestId, onSuccess, onFailure, stopPolling]);

    useEffect(() => {
        if (!checkoutRequestId || !isPolling) return;

        let currentAttempt = 0;

        const poll = async () => {
            if (currentAttempt >= maxAttempts) {
                stopPolling();
                if (onTimeout && !hasCalledCallbackRef.current) {
                    hasCalledCallbackRef.current = true;
                    onTimeout();
                }
                return;
            }

            await checkStatus();
            currentAttempt++;
            setAttempts(currentAttempt);

            // Schedule next poll with calculated delay
            if (isPolling && currentAttempt < maxAttempts) {
                const delay = calculateDelay(currentAttempt);
                intervalRef.current = setTimeout(poll, delay);
            }
        };

        // Start polling
        poll();

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [checkoutRequestId, maxAttempts, isPolling, checkStatus, calculateDelay, stopPolling, onTimeout]);

    return {
        data,
        isPolling,
        error,
        attempts,
        stopPolling
    };
}