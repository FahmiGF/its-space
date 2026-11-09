import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { CATEGORY_META } from "@/lib/constants";
import type { FacilityCard as FacilityCardType } from "@/lib/types";
import { formatOperatingHours } from "@/lib/facilities";
import { CategoryIcon } from "./category-icon";
import { FacilityBadge } from "./status-badge";

export function FacilityCard({
  facility,
  priority = false,
}: {
  facility: FacilityCardType;
  priority?: boolean;
}) {
  const category = CATEGORY_META[facility.category];
  return (
    <Link href={`/facilities/${facility.slug}`} className="facility-card">
      <div className="facility-media">
        {facility.imageUrl ? (
          <img
            src={facility.imageUrl}
            alt={`${facility.name}, ${facility.buildingName}`}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="facility-image-fallback" />
        )}
        <div className="facility-media-top">
          <span className={`category-pill category-${category.tone}`}>
            <CategoryIcon category={facility.category} size={14} />
            {category.label}
          </span>
          {facility.status !== "active" && <FacilityBadge status={facility.status} />}
        </div>
        <span className="media-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="facility-card-body">
        <div className="facility-location">
          <MapPin size={13} />
          {facility.buildingName} · {facility.floor}
        </div>
        <h3>{facility.name}</h3>
        <p>{facility.description}</p>
        <div className="facility-meta">
          <span>
            <Users size={15} /> {facility.capacity.toLocaleString("id-ID")} orang
          </span>
          {facility.areaM2 && <span>{facility.areaM2} m²</span>}
          <span>{facility.requiresApproval ? "Perlu persetujuan" : "Instan"}</span>
        </div>
        <div className="facility-amenities">
          {facility.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
          {facility.amenities.length > 3 && <span>+{facility.amenities.length - 3}</span>}
        </div>
        <div className="facility-card-foot">
          <span>{formatOperatingHours(facility.opensAt, facility.closesAt)}</span>
          <strong>Lihat jadwal</strong>
        </div>
      </div>
    </Link>
  );
}
