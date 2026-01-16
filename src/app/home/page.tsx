
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link";

const propertyImages = [
    { id: 1, height: 400, width: 300, query: "modern minimalist apartment exterior" },
    { id: 2, height: 300, width: 300, query: "luxury living room with large windows" },
    { id: 3, height: 500, width: 300, query: "scandinavian style bedroom design" },
    { id: 4, height: 350, width: 300, query: "contemporary kitchen with marble island" },
    { id: 5, height: 450, width: 300, query: "modern house facade at dusk" },
    { id: 6, height: 300, width: 300, query: "cozy studio apartment interior" },
    { id: 7, height: 550, width: 300, query: "architectural detail of a balcony" },
    { id: 8, height: 400, width: 300, query: "elegant dining area with designer lighting" },
]

export default function HomePage() {

    return (
        <main className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden dotted-bg">
            {/* Left Side: Branding and Vision */}
            <section className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 z-10 bg-background dotted-bg">
                <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 bg-background">
                    <header>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">Malipo Agents.</h1>
                    </header>

                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-medium text-muted-foreground leading-snug text-pretty">
                            The complete ecosystem for modern living and property management.
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                            We empower landlords to manage their properties with precision, while helping tenants find their perfect
                            home with ease. Seamless, secure, and sophisticated.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button asChild size="lg" className="rounded-full px-8 text-base font-medium">
                            <Link href="/join-apartment">
                                Find a Home
                            </Link>
                        </Button>

                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-full px-8 text-base font-medium border-border hover:bg-muted bg-transparent"
                        >
                            <Link href="/account">
                                My Account
                            </Link>
                        </Button>
                    </div>

                </div>
            </section>

            {/* Right Side: Masonry Layout */}
            <section className="w-full md:w-1/2 relative h-[50vh] md:h-screen">
                <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4 overflow-y-auto scrollbar-hide md:pt-16 lg:pt-24 pb-24 mask-image-bottom">
                    {/* Column 1 */}
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
                        {propertyImages
                            .filter((_, i) => i % 2 === 0)
                            .map((img) => (
                                <div
                                    key={img.id}
                                    className="relative overflow-hidden rounded-2xl bg-muted transition-transform hover:scale-[1.02] duration-500"
                                    style={{ height: `${img.height}px` }}
                                >
                                    <Image
                                        src={`/havens1.png?height=${img.height}&width=${img.width}&query=${encodeURIComponent(img.query)}`}
                                        alt={img.query}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-4 mt-8 md:mt-16 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                        {propertyImages
                            .filter((_, i) => i % 2 !== 0)
                            .map((img) => (
                                <div
                                    key={img.id}
                                    className="relative overflow-hidden rounded-2xl bg-muted transition-transform hover:scale-[1.02] duration-500"
                                    style={{ height: `${img.height}px` }}
                                >
                                    <Image
                                        src={`/havens2.jpeg?height=${img.height}&width=${img.width}&query=${encodeURIComponent(img.query)}`}
                                        alt={img.query}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {/* Subtle Gradient Overlay for depth */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 via-transparent to-transparent hidden md:block" />
            </section>

            {/* Decorative vertical line (inspired by design elements in prompt) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border/20 hidden md:block" />
        </main>
    )
}