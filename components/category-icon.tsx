import {
  Building2,
  Clapperboard,
  Dumbbell,
  FlaskConical,
  Presentation,
  Trees,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { FacilityCategory } from "@/lib/types";

const ICONS: Record<FacilityCategory, LucideIcon> = {
  sports: Dumbbell,
  auditorium: Presentation,
  meeting: UsersRound,
  lab: FlaskConical,
  studio: Clapperboard,
  outdoor: Trees,
};

export function CategoryIcon({
  category,
  size = 20,
}: {
  category: FacilityCategory;
  size?: number;
}) {
  const Icon = ICONS[category] ?? Building2;
  return <Icon size={size} aria-hidden="true" />;
}
