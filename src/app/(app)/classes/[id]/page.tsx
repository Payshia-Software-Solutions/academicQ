
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Tag, DollarSign, Info } from "lucide-react";

async function getCourseDetails(id: string) {
    try {
        // We fetch all courses and find the one with the matching ID
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.records.find((c: any) => c.id.toString() === id.toString());
    } catch (error) {
        console.error("Failed to fetch course details:", error);
        return null;
    }
}

async function getCourseBuckets(id: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/course_buckets/course/${id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch course buckets:", error);
        return [];
    }
}

export default async function ClassDetailsPage({ params }: { params: { id: string } }) {
  const course = await getCourseDetails(params.id);
  const buckets = await getCourseBuckets(params.id);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <header>
        <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="truncate">{course.course_name}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-foreground">{course.course_name}</h1>
                <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
            <Button asChild>
                <Link href={`/classes/${params.id}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Bucket
                </Link>
            </Button>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">Payment Buckets</h2>
        {buckets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buckets.map((bucket: any) => (
                    <Card key={bucket.id}>
                        <CardHeader>
                            <CardTitle>{bucket.name}</CardTitle>
                            <CardDescription>{bucket.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">${parseFloat(bucket.payment_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize">{bucket.payment_type || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span>Status: {bucket.is_active === "1" ? "Active" : "Inactive"}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No payment buckets found for this course.</p>
                <Button variant="outline" className="mt-4" asChild>
                     <Link href={`/classes/${params.id}/create-bucket?name=${encodeURIComponent(course.course_name)}&description=${encodeURIComponent(course.description)}`}>
                        Create the First Bucket
                    </Link>
                </Button>
            </div>
        )}
      </section>
    </div>
  );
}
