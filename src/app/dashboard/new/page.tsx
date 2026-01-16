"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, DollarSign, Wallet, Plus, X, Loader2 } from "lucide-react";
import {useApartment} from "@/hooks/use-apartment-context";

interface SessionUser {
    roles: Role[];
}

export default function CreateApartmentPage() {
    const { data: session, status } = useSession();
    const { resetApartment } = useApartment()
    const router = useRouter();
    const { update } = useSession();
    const [formData, setFormData] = useState({
        name: "",
        numberOfDoors: 1,
        houseType: "bed_sitter" as "bed_sitter" | "single_stone" | "single_wood",
        rentAmount: 0,
        additionalCharges: {
            water: 0,
            electricity: 0,
            other: [] as { label: string; amount: number }[],
        },
        withDeposit: false,
        depositAmount: 0,
        landlordPhoneNumber: "",
        disbursementAccount: {
            type: "safaricom" as "safaricom" | "bank",
            safaricomNumber: "",
            bankPaybill: "",
            bankAccountNumber: "",
        },
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            const prev = document.referrer || "/";
            router.replace(prev);
            return;
        }

        const user = session.user as SessionUser;
        const roles = Array.isArray(user.roles) ? user.roles : [];
        const isLandlord = roles.includes(Role.LANDLORD);

        if (!isLandlord) {
            const prev = document.referrer && !document.referrer.includes(window.location.href)
                ? document.referrer
                : "/";
            setTimeout(() => {
                router.replace(prev);
            }, 100);
        }
    }, [session, status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/apartments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await update();
                resetApartment()
                router.push("/dashboard/add-remove");

            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to create apartment");
            }
        } catch {
            alert("Failed to create apartment");
        } finally {
            setLoading(false);
        }
    };

    const addOtherCharge = () => {
        setFormData(prev => ({
            ...prev,
            additionalCharges: {
                ...prev.additionalCharges,
                other: [...prev.additionalCharges.other, { label: "", amount: 0 }]
            }
        }));
    };

    const updateOtherCharge = (index: number, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            additionalCharges: {
                ...prev.additionalCharges,
                other: prev.additionalCharges.other.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                )
            }
        }));
    };

    const removeOtherCharge = (index: number) => {
        setFormData(prev => ({
            ...prev,
            additionalCharges: {
                ...prev.additionalCharges,
                other: prev.additionalCharges.other.filter((_, i) => i !== index)
            }
        }));
    };

    return (
        <div className="min-h-screen bg-background dotted-bg">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                        Create New Apartment
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Add a new property to your portfolio
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-500" />
                                <CardTitle>Basic Information</CardTitle>
                            </div>
                            <CardDescription>
                                Essential details about your property
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Apartment Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="e.g., Sunset Apartments"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="numberOfDoors">Number of Houses</Label>
                                    <Input
                                        id="numberOfDoors"
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.numberOfDoors}
                                        onChange={(e) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                numberOfDoors: parseInt(e.target.value, 10) || 0
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="houseType">House Type</Label>
                                    <Select
                                        value={formData.houseType}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            houseType: value as "bed_sitter" | "single_stone" | "single_wood"
                                        }))}
                                    >
                                        <SelectTrigger id="houseType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bed_sitter">Bed Sitter</SelectItem>
                                            <SelectItem value="single_stone">Single (Stone)</SelectItem>
                                            <SelectItem value="single_wood">Single (Wood)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="landlordPhone">Landlord Contact</Label>
                                    <Input
                                        id="landlordPhone"
                                        type="text"
                                        placeholder="2547XXXXXXXX"
                                        required
                                        value={formData.landlordPhoneNumber}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            landlordPhoneNumber: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-purple-500" />
                                <CardTitle>Pricing & Charges</CardTitle>
                            </div>
                            <CardDescription>
                                Set rent and additional monthly charges
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="rentAmount">Monthly Rent (KES)</Label>
                                    <Input
                                        id="rentAmount"
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.rentAmount}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            rentAmount: parseInt(e.target.value, 10) || 0
                                        }))}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="withDeposit" className="text-base">
                                            Require Deposit
                                        </Label>
                                        <Switch
                                            id="withDeposit"
                                            checked={formData.withDeposit}
                                            onCheckedChange={(checked) => setFormData(prev => ({
                                                ...prev,
                                                withDeposit: checked
                                            }))}
                                        />
                                    </div>

                                    {formData.withDeposit && (
                                        <div className="space-y-2">
                                            <Label htmlFor="depositAmount">Deposit Amount (KES)</Label>
                                            <Input
                                                id="depositAmount"
                                                type="number"
                                                min="0"
                                                required
                                                value={formData.depositAmount}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    depositAmount: parseInt(e.target.value)
                                                }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Monthly Utility Charges</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="water">Water (KES)</Label>
                                        <Input
                                            id="water"
                                            type="number"
                                            min="0"
                                            value={formData.additionalCharges.water}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                additionalCharges: {
                                                    ...prev.additionalCharges,
                                                    water: parseInt(e.target.value) || 0
                                                }
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="electricity">Electricity (KES)</Label>
                                        <Input
                                            id="electricity"
                                            type="number"
                                            min="0"
                                            value={formData.additionalCharges.electricity}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                additionalCharges: {
                                                    ...prev.additionalCharges,
                                                    electricity: parseInt(e.target.value) || 0
                                                }
                                            }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Other Monthly Charges</Label>
                                    {formData.additionalCharges.other.map((charge, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Charge name"
                                                className="flex-1"
                                                value={charge.label}
                                                onChange={(e) => updateOtherCharge(index, "label", e.target.value)}
                                            />
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Amount"
                                                className="w-32"
                                                value={charge.amount}
                                                onChange={(e) => updateOtherCharge(index, "amount", parseInt(e.target.value) || 0)}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeOtherCharge(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOtherCharge}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Other Charge
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disbursement Account */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-purple-500" />
                                <CardTitle>Payment Disbursement</CardTitle>
                            </div>
                            <CardDescription>
                                Where tenant payments will be sent
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Account Type</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="disbursementType"
                                            value="safaricom"
                                            checked={formData.disbursementAccount.type === "safaricom"}
                                            onChange={() => setFormData(prev => ({
                                                ...prev,
                                                disbursementAccount: {
                                                    ...prev.disbursementAccount,
                                                    type: "safaricom"
                                                }
                                            }))}
                                            className="text-purple-500"
                                        />
                                        <span className="text-sm">M-Pesa</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="disbursementType"
                                            value="bank"
                                            checked={formData.disbursementAccount.type === "bank"}
                                            onChange={() => setFormData(prev => ({
                                                ...prev,
                                                disbursementAccount: {
                                                    ...prev.disbursementAccount,
                                                    type: "bank"
                                                }
                                            }))}
                                            className="text-purple-500"
                                        />
                                        <span className="text-sm">Bank Account</span>
                                    </label>
                                </div>
                            </div>

                            {formData.disbursementAccount.type === "safaricom" && (
                                <div className="space-y-2">
                                    <Label htmlFor="mpesaNumber">M-Pesa Phone Number</Label>
                                    <Input
                                        id="mpesaNumber"
                                        type="text"
                                        placeholder="2547XXXXXXXX"
                                        required
                                        value={formData.disbursementAccount.safaricomNumber}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            disbursementAccount: {
                                                ...prev.disbursementAccount,
                                                safaricomNumber: e.target.value
                                            }
                                        }))}
                                    />
                                </div>
                            )}

                            {formData.disbursementAccount.type === "bank" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankPaybill">Bank Paybill Number</Label>
                                        <Input
                                            id="bankPaybill"
                                            type="text"
                                            placeholder="e.g., 444555"
                                            required
                                            value={formData.disbursementAccount.bankPaybill}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                disbursementAccount: {
                                                    ...prev.disbursementAccount,
                                                    bankPaybill: e.target.value
                                                }
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccount">Bank Account Number</Label>
                                        <Input
                                            id="bankAccount"
                                            type="text"
                                            placeholder="Account number"
                                            required
                                            value={formData.disbursementAccount.bankAccountNumber}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                disbursementAccount: {
                                                    ...prev.disbursementAccount,
                                                    bankAccountNumber: e.target.value
                                                }
                                            }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="min-w-[160px] bg-purple-500 hover:bg-purple-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Apartment"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}