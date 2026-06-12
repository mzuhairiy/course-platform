import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { getInitials } from "@/lib/utils";
import type { SpotlightInstructor } from "@/server/services/instructor";

export function InstructorCard({
  instructor,
}: {
  instructor: SpotlightInstructor;
}) {
  const courseCount = instructor._count.authoredCourses;

  return (
    <Card className="flex items-center gap-4 p-6" data-testid="instructor-card">
      <Avatar className="h-14 w-14">
        {instructor.image ? (
          <AvatarImage src={instructor.image} alt={instructor.name ?? ""} />
        ) : null}
        <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{instructor.name ?? "Instructor"}</p>
        <Text variant="muted" as="span">
          {courseCount} published course{courseCount === 1 ? "" : "s"}
        </Text>
      </div>
    </Card>
  );
}
