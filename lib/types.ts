export type UserRole = "student" | "staff" | "admin";
export type FacilityCategory = "sports" | "auditorium" | "meeting" | "lab" | "studio" | "outdoor";
export type FacilityStatus = "active" | "maintenance" | "closed";
export type PaymentStatus = "none" | "pending" | "paid" | "failed" | "expired" | "refunded";
export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "checked_in"
  | "completed"
  | "no_show";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string | null;
};

export type Facility = {
  id: string;
  slug: string;
  name: string;
  category: FacilityCategory;
  floor: string;
  capacity: number;
  areaM2: number | null;
  description: string;
  amenities: string[];
  equipment: string[];
  rules: string[];
  imageUrl: string | null;
  requiresApproval: boolean;
  pricePerHour: number;
  status: FacilityStatus;
  opensAt: string;
  closesAt: string;
  featured: boolean;
  managerName: string | null;
  managerEmail: string | null;
  buildingName: string;
  buildingCode: string;
  campusName: string;
  institutionName: string;
};

export type FacilityCard = Pick<
  Facility,
  | "id"
  | "slug"
  | "name"
  | "category"
  | "floor"
  | "capacity"
  | "areaM2"
  | "description"
  | "amenities"
  | "imageUrl"
  | "requiresApproval"
  | "pricePerHour"
  | "status"
  | "opensAt"
  | "closesAt"
  | "featured"
  | "buildingName"
  | "buildingCode"
  | "campusName"
>;

export type AvailabilityBooking = {
  id: string;
  reference: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  purpose: string;
};

export type AvailabilityDay = {
  date: string;
  label: string;
  weekday: string;
  freeSlots: number;
  totalSlots: number;
  isClosed: boolean;
};

export type Booking = {
  id: string;
  reference: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  purpose: string;
  attendees: number;
  organization: string | null;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  checkedInAt: string | null;
  amountDue: number;
  paymentStatus: PaymentStatus;
  facility: {
    id: string;
    slug: string;
    name: string;
    category: FacilityCategory;
    imageUrl: string | null;
    buildingName: string;
    buildingCode: string;
    capacity: number;
    requiresApproval: boolean;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    organization: string | null;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string | null;
  phone: string | null;
  notifyBooking: boolean;
  notifyReminders: boolean;
  notifyAnnouncements: boolean;
  createdAt: string;
};

export type FacilityFilters = {
  q?: string;
  category?: FacilityCategory;
  building?: string;
  minCapacity?: number;
  date?: string;
  start?: string;
  end?: string;
  amenity?: string;
  onlyAvailable?: boolean;
};

export type DashboardStats = {
  facilities: number;
  activeFacilities: number;
  todayBookings: number;
  pendingBookings: number;
  utilization: number;
  totalBookings: number;
  cancelled: number;
  noShow: number;
  popular: Array<{ name: string; count: number; capacity: number }>;
  byBuilding: Array<{ name: string; count: number }>;
  daily: Array<{ date: string; label: string; count: number }>;
};
