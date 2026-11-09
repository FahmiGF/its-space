import { BOOKING_STATUS_META, FACILITY_STATUS_LABEL } from "@/lib/constants";
import type { BookingStatus, FacilityStatus } from "@/lib/types";

export function BookingBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <span className={`status-badge status-${meta.tone}`}>{meta.label}</span>;
}

export function FacilityBadge({ status }: { status: FacilityStatus }) {
  return (
    <span className={`status-badge facility-${status}`}>
      <i />
      {FACILITY_STATUS_LABEL[status]}
    </span>
  );
}
