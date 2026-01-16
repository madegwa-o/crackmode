"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Apartment {
    name: string | null
    apartmentId: string | null
}

interface ApartmentContextValue {
    apartment: Apartment
    setApartment: React.Dispatch<React.SetStateAction<Apartment>>
    resetApartment: () => void
    isLoaded: boolean
}

const initialApartment: Apartment = {
    name: null,
    apartmentId: null,
}

const ApartmentContext = createContext<ApartmentContextValue | null>(null)

export const useApartment = () => {
    const context = useContext(ApartmentContext)
    if (!context) {
        throw new Error("useApartment must be used within ApartmentProvider")
    }
    return context
}

export function ApartmentProvider({ children }: { children: React.ReactNode }) {
    const [apartment, setApartment] = useState<Apartment>(initialApartment)
    const [isLoaded, setIsLoaded] = useState(false)

    /* Load once */
    useEffect(() => {
        const stored = localStorage.getItem("currentApartment")
        if (stored) {
            try {
                setApartment(JSON.parse(stored))
            } catch {
                localStorage.removeItem("currentApartment")
            }
        }
        setIsLoaded(true)
    }, [])

    /* Persist only when valid */
    useEffect(() => {
        if (!isLoaded) return

        if (apartment.apartmentId) {
            localStorage.setItem("currentApartment", JSON.stringify(apartment))
        } else {
            localStorage.removeItem("currentApartment")
        }
    }, [apartment, isLoaded])

    const resetApartment = () => {
        setApartment(initialApartment)
        localStorage.removeItem("currentApartment")
    }

    return (
        <ApartmentContext.Provider
            value={{ apartment, setApartment, resetApartment, isLoaded }}
        >
            {children}
        </ApartmentContext.Provider>
    )
}
