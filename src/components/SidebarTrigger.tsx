"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function SidebarTrigger() {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => (globalThis).__openSidebar?.(true)}
        >
            <Menu className="h-5 w-5" />
        </Button>
    )
}
