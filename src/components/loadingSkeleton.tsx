
// ✅ OPTIMIZATION 2: Loading skeleton component
import {Card, CardContent} from "@/components/ui/card";

export default function LoadingSkeleton() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="grid gap-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

