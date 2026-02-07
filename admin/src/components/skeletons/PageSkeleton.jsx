import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
    return (
        <div className="flex h-screen bg-muted/10">
            {/* Sidebar Skeleton */}
            <div className="hidden border-r bg-muted/40 md:block w-64 p-4 space-y-4">
                <div className="h-8 w-8 mb-8">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>

                {/* Nav Items */}
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Skeleton */}
                <header className="h-14 border-b px-6 flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                {/* content area */}
                <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>

                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </main>
            </div>
        </div>
    );
}
