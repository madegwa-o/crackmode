"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Phone, MapPin, User, CheckCircle2, Loader2 } from "lucide-react";
import useSWR from "swr";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Updated type definitions to include house charges and deposit
interface HouseWithCharges {
	_id: string;
	doorNumber: string;
	status: 'vacant' | 'occupied';
	rentAmount: number;
	depositAmount?: number;
	additionalCharges: {
		electricity?: number;
		water?: number;
		other?: Array<{
			label: string;
			amount: number;
		}>;
	};
}

interface PopulatedApartment extends IApartment {
	_id: string;
	landlord: {
		_id: string;
		name: string;
		email: string;
	};
	houses: HouseWithCharges[];
}

interface IApartment {
	name: string;
	houseType: string;
	rentAmount: number;
	depositAmount?: number;
	withDeposit: boolean;
	landlordPhoneNumber: string;
	numberOfDoors: number;
	additionalCharges: {
		electricity?: number;
		water?: number;
		other?: Array<{
			_id: string;
			label: string;
			amount: number;
		}>;
	};
	disbursementAccount: {
		type: 'bank' | 'safaricom';
		safaricomNumber?: string;
		bankPaybill?: string;
		bankAccountNumber?: string;
	};
}

interface ApartmentsResponse {
	apartments: PopulatedApartment[];
}

interface PaymentItem {
	id: string;
	label: string;
	amount: number;
	selected: boolean;
	required?: boolean;
}

const LoadingSpinner = () => (
	<div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--foreground)] border-t-transparent"></div>
);

const ApartmentSkeleton = () => (
	<div className="p-6 border border-[var(--border)] rounded-xl animate-pulse">
		<div className="space-y-3">
			<div className="h-6 bg-[var(--surface-secondary)] rounded w-40"></div>
			<div className="h-4 bg-[var(--surface-secondary)] rounded w-32"></div>
			<div className="h-4 bg-[var(--surface-secondary)] rounded w-48"></div>
		</div>
	</div>
);

const PaymentStatusModal = ({
								isPolling,
								attempts,
								paymentStatus
							}: {
	isPolling: boolean;
	attempts: number;
	paymentStatus: string | null;
}) => (
	<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<Card className="w-full max-w-md mx-4">
			<CardContent className="p-6 text-center">
				{isPolling ? (
					<>
						<Loader2 className="h-12 w-12 text-[var(--foreground)] animate-spin mx-auto mb-4" />
						<h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
						<p className="text-[var(--text-secondary)] mb-4">
							Please complete the M-PESA prompt on your phone
						</p>
						<div className="text-sm text-[var(--text-tertiary)]">
							Checking payment status... (Attempt {attempts})
						</div>
					</>
				) : paymentStatus === 'completed' ? (
					<>
						<CheckCircle2 className="h-12 w-12 text-[var(--success)] mx-auto mb-4" />
						<h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
						<p className="text-[var(--text-secondary)]">Completing your registration...</p>
					</>
				) : (
					<>
						<div className="h-12 w-12 bg-[var(--surface-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-[var(--foreground)] text-2xl">✕</span>
						</div>
						<h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
						<p className="text-[var(--text-secondary)]">Please try again</p>
					</>
				)}
			</CardContent>
		</Card>
	</div>
);

export default function JoinApartmentPage() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<'apartments' | 'apartment-details' | 'houses' | 'payment'>('apartments');
	const [selectedApartment, setSelectedApartment] = useState<PopulatedApartment | null>(null);
	const [selectedHouse, setSelectedHouse] = useState<HouseWithCharges | null>(null);
	const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
	const [phone, setPhone] = useState("");
	const [submitLoading, setSubmitLoading] = useState(false);
	const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
	const [paymentId, setPaymentId] = useState<string | null>(null);

	const { data: apartmentsData, isLoading: apartmentsLoading, error: apartmentsError } = useSWR<ApartmentsResponse>(
		"/api/apartments?view=tenant",
		fetcher
	);

	const { data: paymentStatus, isPolling } = usePaymentPolling({
		checkoutRequestId: checkoutRequestId || '',
		maxAttempts: 30,
		baseInterval: 2000,
		useExponentialBackoff: true,
		onSuccess: async (data) => {
			console.log('Payment successful:', data);
			await joinApartment();
		},
		onFailure: (data) => {
			console.error('Payment failed:', data);
			setSubmitLoading(false);
			alert(`Payment failed: ${data.resultDesc || 'Unknown error'}`);
			setCheckoutRequestId(null);
			setPaymentId(null);
		},
		onTimeout: () => {
			console.error('Payment polling timeout');
			setSubmitLoading(false);
			alert('Payment verification timed out. Please check your M-PESA messages and contact support if payment was deducted.');
			setCheckoutRequestId(null);
			setPaymentId(null);
		}
	});

	const formatHouseType = (houseType: string): string => {
		return houseType.replace("_", " ").toUpperCase();
	};

	// Initialize payment items when HOUSE is selected (not apartment)
	useEffect(() => {
		if (!selectedHouse || !selectedApartment) return;

		const items: PaymentItem[] = [
			{
				id: 'rent',
				label: 'Monthly Rent',
				amount: selectedHouse.rentAmount, // Use house rent
				selected: true,
				required: true
			}
		];

		// Use house-specific deposit if available, otherwise fall back to apartment deposit
		const depositAmount = selectedHouse.depositAmount ?? selectedApartment.depositAmount;
		if (depositAmount && depositAmount > 0) {
			items.push({
				id: 'deposit',
				label: 'Security Deposit',
				amount: depositAmount,
				selected: false
			});
		}

		// Use house-specific charges
		if (selectedHouse.additionalCharges) {
			const { electricity, water, other } = selectedHouse.additionalCharges;

			if (electricity && electricity > 0) {
				items.push({
					id: 'electricity',
					label: 'Electricity',
					amount: electricity,
					selected: false
				});
			}

			if (water && water > 0) {
				items.push({
					id: 'water',
					label: 'Water',
					amount: water,
					selected: false
				});
			}

			if (other && other.length > 0) {
				other.forEach((charge, index) => {
					items.push({
						id: `other-${index}`,
						label: charge.label,
						amount: charge.amount,
						selected: false
					});
				});
			}
		}

		setPaymentItems(items);
	}, [selectedHouse, selectedApartment]);

	const handleApartmentSelect = (apartment: PopulatedApartment) => {
		setSelectedApartment(apartment);
		setCurrentStep('apartment-details');
	};

	const handleHouseSelect = (house: HouseWithCharges) => {
		setSelectedHouse(house);
		setCurrentStep('payment');
	};

	const handlePaymentToggle = (itemId: string) => {
		setPaymentItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, selected: item.required ? true : !item.selected }
					: item
			)
		);
	};

	const calculateTotal = (): number => {
		return paymentItems
			.filter(item => item.selected)
			.reduce((total, item) => total + item.amount, 0);
	};

	const joinApartment = async () => {
		if (!selectedHouse || !selectedApartment || !paymentId) {
			console.error('Missing required data for joining apartment');
			setSubmitLoading(false);
			return;
		}

		try {
			const selectedCharges = paymentItems
				.filter(item => item.selected)
				.map(item => ({ id: item.id, label: item.label, amount: item.amount }));

			const joinResponse = await fetch("/api/apartments/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apartmentId: selectedApartment._id,
					houseId: selectedHouse._id,
					phone,
					selectedCharges,
					totalAmount: calculateTotal(),
					paymentId: paymentId
				}),
			});

			if (joinResponse.ok) {
				router.push("/dashboard");
			} else {
				const error = await joinResponse.json();
				throw new Error(error.error || "Failed to join apartment");
			}
		} catch (error) {
			console.error('Join apartment error:', error);
			alert(error instanceof Error ? error.message : "Failed to join apartment");
			setSubmitLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedHouse || !phone || !selectedApartment) return;

		setSubmitLoading(true);

		try {
			const selectedCharges = paymentItems
				.filter(item => item.selected)
				.map(item => ({ id: item.id, label: item.label, amount: item.amount }));

			const stkResponse = await fetch('/api/payments/direct/stk', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phoneNumber: phone,
					amount: calculateTotal(),
					partyB: selectedApartment.disbursementAccount.bankPaybill,
					accountReference: selectedApartment.disbursementAccount.bankAccountNumber,
					transactionDesc: `Joining Payment for House ${selectedHouse.doorNumber}`,
					transactionType: 'CustomerPayBillOnline',
					apartmentId: selectedApartment._id,
					houseId: selectedHouse._id,
					selectedCharges,
					paymentType: 'joining',
					paymentPeriod: null
				}),
			});

			if (!stkResponse.ok) {
				const error = await stkResponse.json();
				throw new Error(error.error || "Failed to initiate payment");
			}

			const stkData = await stkResponse.json();
			console.log('STK Push initiated:', stkData);

			setCheckoutRequestId(stkData.data.checkoutRequestId);
			setPaymentId(stkData.data.paymentId);

		} catch (error) {
			console.error('Payment error:', error);
			alert(error instanceof Error ? error.message : "Payment failed");
			setSubmitLoading(false);
		}
	};

	const goBack = () => {
		switch (currentStep) {
			case 'apartment-details':
				setCurrentStep('apartments');
				setSelectedApartment(null);
				break;
			case 'houses':
				setCurrentStep('apartment-details');
				break;
			case 'payment':
				setCurrentStep('houses');
				setSelectedHouse(null);
				setPaymentItems([]);
				break;
		}
	};

	const getAvailableHouses = () => {
		if (!selectedApartment) return [];
		return selectedApartment.houses?.filter(house => house.status === 'vacant') || [];
	};

	if (apartmentsError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center text-[var(--foreground)]">
					Failed to load apartments. Please try again later.
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-8">
			{submitLoading && checkoutRequestId && (
				<PaymentStatusModal
					isPolling={isPolling}
					attempts={0}
					paymentStatus={paymentStatus?.status || null}
				/>
			)}
			<div className="max-w-2xl mx-auto px-4">
				<div className="flex items-center gap-4 mb-8">
					{currentStep !== 'apartments' && (
						<Button
							variant="ghost"
							size="sm"
							onClick={goBack}
							className="p-2"
						>
							<ChevronLeft className="h-5 w-5" />
						</Button>
					)}
					<div>
						<h1 className="text-2xl font-bold">
							{currentStep === 'apartments' && "Available Apartments"}
							{currentStep === 'apartment-details' && selectedApartment?.name}
							{currentStep === 'houses' && "Select a House"}
							{currentStep === 'payment' && "Payment Details"}
						</h1>
						{currentStep === 'apartment-details' && (
							<p className="text-[var(--text-secondary)] mt-1">Apartment Details</p>
						)}
					</div>
				</div>

				{currentStep === 'apartments' && (
					<div className="space-y-4">
						{apartmentsLoading ? (
							[...Array(3)].map((_, i) => <ApartmentSkeleton key={i} />)
						) : (
							apartmentsData?.apartments?.map((apartment) => {
								const vacantCount = apartment.houses?.filter(h => h.status === 'vacant').length || 0;
								const vacantHouses = apartment.houses?.filter(h => h.status === 'vacant') || [];
								const minRent = vacantHouses.length > 0
									? Math.min(...vacantHouses.map(h => h.rentAmount))
									: apartment.rentAmount;
								const maxRent = vacantHouses.length > 0
									? Math.max(...vacantHouses.map(h => h.rentAmount))
									: apartment.rentAmount;

								return (
									<Card
										key={apartment._id}
										className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-sm"
										onClick={() => handleApartmentSelect(apartment)}
									>
										<CardContent className="p-6">
											<div className="flex justify-between items-start">
												<div className="space-y-2">
													<h3 className="text-xl font-semibold text-[var(--text-primary)]">
														{apartment.name}
													</h3>
													<div className="flex items-center gap-2 text-[var(--text-secondary)]">
														<MapPin className="h-4 w-4" />
														<span>{formatHouseType(apartment.houseType)}</span>
													</div>
													<div className="text-2xl font-bold text-[var(--success)]">
														{minRent === maxRent ? (
															<>KES {minRent.toLocaleString()}</>
														) : (
															<>KES {minRent.toLocaleString()} - {maxRent.toLocaleString()}</>
														)}
														<span className="text-sm font-normal text-[var(--text-tertiary)]">/month</span>
													</div>
												</div>
												<div className="text-right text-sm text-[var(--text-tertiary)]">
													<div className="bg-[var(--surface-secondary)] text-[var(--success)] px-3 py-1 rounded-full">
														{vacantCount} available
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})
						)}
					</div>
				)}

				{currentStep === 'apartment-details' && selectedApartment && (
					<div className="space-y-6">
						<Card className="border-0 shadow-sm">
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<MapPin className="h-5 w-5 text-[var(--text-tertiary)]" />
										<div>
											<p className="font-medium">{formatHouseType(selectedApartment.houseType)}</p>
											<p className="text-sm text-[var(--text-secondary)]">{selectedApartment.numberOfDoors} units total</p>
										</div>
									</div>

									<div className="pt-4 border-t border-[var(--border)]">
										<p className="text-sm text-[var(--text-secondary)] mb-2">Rent varies by house - see details when selecting</p>
										{selectedApartment.withDeposit && selectedApartment.depositAmount && (
											<div>
												<p className="text-sm text-[var(--text-secondary)]">Security Deposit</p>
												<p className="text-lg font-semibold text-[var(--foreground)]">
													KES {selectedApartment.depositAmount.toLocaleString()}
												</p>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg">Landlord Contact</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<User className="h-4 w-4 text-[var(--text-tertiary)]" />
										<span>{selectedApartment.landlord.name}</span>
									</div>
									<div className="flex items-center gap-3">
										<Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
										<span>{selectedApartment.landlordPhoneNumber}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Button
							onClick={() => setCurrentStep('houses')}
							className="w-full py-3"
							size="lg"
						>
							Continue to Select House
						</Button>
					</div>
				)}

				{currentStep === 'houses' && selectedApartment && (
					<div className="space-y-4">
						{getAvailableHouses().map((house) => {
							const depositAmount = house.depositAmount ?? selectedApartment.depositAmount;
							const hasDeposit = depositAmount && depositAmount > 0;

							return (
								<Card
									key={house._id}
									className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-sm"
									onClick={() => handleHouseSelect(house)}
								>
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<h3 className="text-lg font-semibold">House {house.doorNumber}</h3>
												<div className="mt-2 space-y-1">
													<div className="flex items-baseline gap-2">
														<span className="text-sm text-[var(--text-secondary)]">Rent:</span>
														<span className="text-xl font-bold text-[var(--success)]">
															KES {house.rentAmount.toLocaleString()}
															<span className="text-sm font-normal text-[var(--text-tertiary)]">/month</span>
														</span>
													</div>
													{hasDeposit && (
														<div className="flex items-baseline gap-2">
															<span className="text-sm text-[var(--text-secondary)]">Deposit:</span>
															<span className="text-base font-semibold text-[var(--foreground)]">
																KES {depositAmount.toLocaleString()}
															</span>
														</div>
													)}
												</div>
												<p className="text-sm text-[var(--success)] mt-2">Available</p>
											</div>
											<div className="w-3 h-3 bg-[var(--success)] rounded-full mt-2"></div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				{currentStep === 'payment' && selectedApartment && selectedHouse && (
					<div className="space-y-6">
						<Card className="border-0 shadow-sm">
							<CardContent className="p-4">
								<div className="flex justify-between items-center">
									<div className="flex-1">
										<h3 className="font-semibold">{selectedApartment.name}</h3>
										<p className="text-sm text-[var(--text-secondary)]">House {selectedHouse.doorNumber}</p>
										<div className="mt-2 space-y-1">
											<div className="flex items-baseline gap-2">
												<span className="text-sm text-[var(--text-secondary)]">Rent:</span>
												<span className="text-lg font-bold text-[var(--success)]">
													KES {selectedHouse.rentAmount.toLocaleString()}/month
												</span>
											</div>
											{(selectedHouse.depositAmount ?? selectedApartment.depositAmount) && (
												<div className="flex items-baseline gap-2">
													<span className="text-sm text-[var(--text-secondary)]">Deposit:</span>
													<span className="text-base font-semibold text-[var(--foreground)]">
														KES {((selectedHouse.depositAmount ?? selectedApartment.depositAmount) || 0).toLocaleString()}
													</span>
												</div>
											)}
										</div>
									</div>
									<CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-sm">
							<CardHeader>
								<CardTitle>Select Charges to Pay</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{paymentItems.map((item) => (
									<div
										key={item.id}
										className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
											item.selected
												? 'border-[var(--foreground)] bg-[var(--surface-hover)]'
												: 'border-[var(--border)] hover:border-[var(--border-hover)]'
										} ${item.required ? 'opacity-75' : 'cursor-pointer'}`}
										onClick={() => !item.required && handlePaymentToggle(item.id)}
									>
										<div className="flex items-center space-x-3">
											<input
												type="checkbox"
												checked={item.selected}
												disabled={item.required}
												onChange={() => handlePaymentToggle(item.id)}
												className="w-4 h-4 rounded focus:ring-[var(--ring-color)]"
											/>
											<div>
												<span className="font-medium">{item.label}</span>
												{item.required && (
													<span className="text-xs text-[var(--text-tertiary)] ml-2">(Required)</span>
												)}
											</div>
										</div>
										<span className="font-semibold">KES {item.amount.toLocaleString()}</span>
									</div>
								))}

								<div className="pt-4 border-t border-[var(--border)]">
									<div className="flex justify-between items-center text-lg font-bold">
										<span>Total Amount:</span>
										<span className="text-[var(--success)]">KES {calculateTotal().toLocaleString()}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-sm">
							<CardContent className="p-4">
								<label className="block text-sm font-medium mb-2">
									M-PESA Phone Number
								</label>
								<input
									type="tel"
									required
									placeholder="0712345678"
									className="w-full border border-[var(--border)] rounded-lg px-4 py-3 bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:border-transparent"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									pattern="(254|0)[17]\d{8}"
									title="Please enter a valid Safaricom number"
									disabled={submitLoading}
								/>
								<p className="text-xs text-[var(--text-tertiary)] mt-2">
									Enter your Safaricom number for M-PESA payment
								</p>
							</CardContent>
						</Card>

						<Button
							onClick={handleSubmit}
							disabled={submitLoading || !phone || calculateTotal() === 0}
							className="w-full py-4 text-lg"
							size="lg"
						>
							{submitLoading ? (
								<div className="flex items-center gap-2">
									<LoadingSpinner />
									Processing Payment...
								</div>
							) : (
								`Pay KES ${calculateTotal().toLocaleString()}`
							)}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}