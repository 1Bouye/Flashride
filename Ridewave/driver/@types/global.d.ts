type ButtonProps = {
  title?: string;
  onPress?: () => void;
  width?: DimensionValue;
  height?: DimensionValue;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
};

type DriverType = {
  id: string;
  name: string;
  country: string;
  phone_number: string;
  email: string;
  vehicle_type: string;
  registration_number: string;
  registration_date: string;
  driving_license: string;
  vehicle_color?: string;
  rate: string;
  ratings: number;
  totalEarning: number;
  totalRides: number;
  pendingRides: number;
  cancelRides: number;
  status: "inactive" | "active";
  accountStatus: "pending" | "approved" | "declined";
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

type recentRidesTypes = {
  id: string;
  user: any;
  rating: string;
  earning: string;
  pickup: string;
  dropoff: string;
  time: string;
  distance: string;
};
