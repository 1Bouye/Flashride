export type DriverAvailabilityStatus = "inactive" | "active";
export type DriverAccountStatus =
  | "pending"
  | "approved"
  | "declined"
  | "blocked";

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  country: string;
  vehicle_type: string;
  registration_number: string;
  registration_date: string;
  driving_license: string;
  vehicle_color?: string;
  rate: string;
  status: DriverAvailabilityStatus;
  accountStatus: DriverAccountStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

