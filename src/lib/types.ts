export type Therapist = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  bio: string;
  photo_url: string | null;
  specialties: string[];
  offers_online: boolean;
  offers_in_person: boolean;
  active: boolean;
  role: "therapist" | "admin";
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string | null;
  document: string | null;
  created_at: string;
  updated_at: string;
};

export type Treatment = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: string;
  name: string;
  type: "online" | "in_person";
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type Availability = {
  id: string;
  therapist_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "09:00"
  end_time: string; // "17:00"
  slot_duration: number; // minutes
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  created_at: string;
};

export type TherapistService = {
  id: string;
  therapist_id: string;
  service_id: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  therapist_id: string;
  treatment_id: string | null;
  branch_id: string | null;
  date: string;
  time: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  cancellation_token?: string;
  created_at: string;
  updated_at: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  created_at: string;
};

export type BookingFormData = {
  branch: Branch | null;
  treatment: Treatment | null;
  therapist: Therapist | null;
  date: Date | null;
  time: string | null;
  patient: {
    name: string;
    email: string;
    phone: string;
    birthdate: string;
    document: string;
  };
};
