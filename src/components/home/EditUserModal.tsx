import { useEffect, useState } from "react"
import { Check, X, User, Mail, Phone, Shield } from "lucide-react"
import { Role } from "@/lib/roles"
import { AdminUser } from "@/app/admin/page"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface EditModalProps {
    user: AdminUser
    onClose: () => void
    onSave: (userId: string, updates: Partial<AdminUser>) => void
}

const ALL_ROLES: Role[] = [
    Role.USER,
    Role.TENANT,
    Role.LANDLORD,
    Role.ADMIN,
    Role.CARETAKER,
]

export function EditModal({ user, onClose, onSave }: EditModalProps) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        roles: [] as Role[],
    })

    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            roles: user.roles,
        })
    }, [user])

    const toggleRole = (role: Role) => {
        setForm(prev => {
            // Prevent removing the last admin role
            if (
                role === Role.ADMIN &&
                prev.roles.includes(Role.ADMIN) &&
                prev.roles.length === 1
            ) {
                return prev
            }

            return {
                ...prev,
                roles: prev.roles.includes(role)
                    ? prev.roles.filter(r => r !== role)
                    : [...prev.roles, role],
            }
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(user._id, {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone || undefined,
                roles: form.roles,
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Update user information and manage their roles and permissions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="Enter full name"
                            value={form.name}
                            onChange={e =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={form.email}
                            onChange={e =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            Phone (Optional)
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+254 712 345 678"
                            value={form.phone}
                            onChange={e =>
                                setForm({ ...form, phone: e.target.value })
                            }
                        />
                    </div>

                    <Separator />

                    {/* Roles Section */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            User Roles
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Select one or more roles for this user
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map(role => {
                                const active = form.roles.includes(role)
                                return (
                                    <Badge
                                        key={role}
                                        variant={active ? "default" : "outline"}
                                        className={`cursor-pointer transition-all hover:scale-105 ${
                                            active
                                                ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                                                : "hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 dark:hover:border-purple-700"
                                        }`}
                                        onClick={() => toggleRole(role)}
                                    >
                                        {role}
                                    </Badge>
                                )
                            })}
                        </div>
                        {form.roles.length === 0 && (
                            <p className="text-sm text-destructive">
                                Please select at least one role
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            isSaving ||
                            form.roles.length === 0 ||
                            !form.name.trim() ||
                            !form.email.trim()
                        }
                        className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}