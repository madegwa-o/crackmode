"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Facebook,
    Twitter,
    Linkedin,
    Mail,
    Copy,
    Check,
    Share2,
    MessageCircle
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShareComponentProps {
    variant?: "buttons" | "compact" | "dropdown"
    url?: string
    title?: string
    description?: string
    className?: string
}

export default function ShareComponent({
                                           variant = "buttons",
                                           url,
                                           title = "Malipo Agents – Smart Property Management",
                                           description = "Manage apartments, tenants, and rent payments from one powerful platform.",
                                           className = ""
                                       }: ShareComponentProps) {
    const [copied, setCopied] = useState(false)
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "https://homes.aistartupclub.com")

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    const handleNativeShare = async () => {
        if (typeof navigator !== "undefined" && "share" in navigator) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url: shareUrl,
                })
            } catch (err) {
                console.error("Error sharing:", err)
            }
        }
    }

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${shareUrl}`)}`,
    }

    const shareButtons = [
        {
            name: "Facebook",
            icon: Facebook,
            href: shareLinks.facebook,
            color: "hover:bg-blue-600 hover:text-white",
            bgColor: "bg-blue-50 dark:bg-blue-950"
        },
        {
            name: "Twitter",
            icon: Twitter,
            href: shareLinks.twitter,
            color: "hover:bg-sky-500 hover:text-white",
            bgColor: "bg-sky-50 dark:bg-sky-950"
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            href: shareLinks.linkedin,
            color: "hover:bg-blue-700 hover:text-white",
            bgColor: "bg-blue-50 dark:bg-blue-950"
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            href: shareLinks.whatsapp,
            color: "hover:bg-green-600 hover:text-white",
            bgColor: "bg-green-50 dark:bg-green-950"
        },
        {
            name: "Email",
            icon: Mail,
            href: shareLinks.email,
            color: "hover:bg-gray-700 hover:text-white",
            bgColor: "bg-gray-50 dark:bg-gray-900"
        },
    ]

    if (variant === "compact") {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <TooltipProvider>
                    <div className="flex items-center gap-1">
                        {shareButtons.map((button) => (
                            <Tooltip key={button.name}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-9 w-9 ${button.color}`}
                                        asChild
                                    >
                                        <a
                                            href={button.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Share on ${button.name}`}
                                        >
                                            <button.icon className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{button.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 hover:bg-primary hover:text-primary-foreground"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{copied ? "Copied!" : "Copy link"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
        )
    }

    if (variant === "buttons") {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {shareButtons.map((button) => (
                        <Button
                            key={button.name}
                            variant="outline"
                            className={`flex flex-col items-center gap-2 h-auto py-4 ${button.bgColor} border-border/40 ${button.color} transition-all`}
                            asChild
                        >
                            <a
                                href={button.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Share on ${button.name}`}
                            >
                                <button.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{button.name}</span>
                            </a>
                        </Button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-border/40">
            <span className="text-sm text-muted-foreground truncate flex-1">
              {shareUrl}
            </span>
                    </div>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="shrink-0"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>

                {typeof navigator !== "undefined" && "share" in navigator && (
                    <Button
                        onClick={handleNativeShare}
                        variant="secondary"
                        className="w-full"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share via...
                    </Button>
                )}
            </div>
        )
    }

    return null
}