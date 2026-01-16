"use client"

import {Button} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Badge} from "@/components/ui/badge"
import {Building2, ChevronDown, Plus} from "lucide-react"
import useSWR from "swr"
import {Skeleton} from "@/components/ui/skeleton"
import {useApartment} from "@/hooks/use-apartment-context";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {hasRole, Role} from "@/lib/roles";

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ApartmentData {
  id: string
  name: string
  type: "Owned" | "Joined"
}

export function ApartmentSelector() {
  const router = useRouter()
  const {data: session, status} = useSession()
  const { apartment, setApartment } = useApartment()
  const { data: apartments, isLoading } = useSWR<ApartmentData[]>("/api/current-apartment", fetcher)

  const handleSelect = (apt: ApartmentData) => {
    setApartment({
      name: apt.name,
      apartmentId: apt.id,
    })
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-40" />
  }

  if(status === "unauthenticated") {
    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <span>Sign up\in</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">

            <DropdownMenuItem onClick={() => router.push("/signin")} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Sign Up
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/signin")} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Sign In
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    )
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent min-w-[160px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{apartment.name || "Select Apartment"}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {apartments && apartments.length > 0 ? (
              apartments.map((apt) => (
                  <DropdownMenuItem key={apt.id} onClick={() => handleSelect(apt)} className="cursor-pointer justify-between">
                    <span className="truncate mr-2">{apt.name}</span>
                    <Badge variant={apt.type === "Owned" ? "default" : "secondary"} className="text-[10px] px-1.5 h-4">
                      {apt.type}
                    </Badge>
                  </DropdownMenuItem>
              ))
          ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No apartments found</div>
          )}
          { session?.user?.roles && hasRole(session?.user?.roles, Role.LANDLORD) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/new")} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Apartment
                </DropdownMenuItem>
              </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
