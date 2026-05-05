export type UserRole = "therapist" | "admin" | "super_admin";
export type AppointmentStatus = "scheduled" | "cancelled" | "completed" | "no_show";
export type PaymentStatus = "pending" | "paid" | "refunded";

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
  role: UserRole;
  salary?: number | null;
  hire_date?: string | null;
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
  address: string | null;
  gender: "M" | "F" | "O" | "N" | null;
  profession: string | null;
  marital_status: "single" | "married" | "divorced" | "widowed" | "other" | null;
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
  price?: number | null;        // en pesos CLP
  price_notes?: string | null;  // nota sobre el precio
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
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  notes?: string | null;
  cancellation_token?: string;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithRelations = Appointment & {
  patient?: Patient;
  therapist?: Therapist;
  treatment?: Treatment | null;
  branch?: Branch | null;
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

// ============================================
// Clinical Records
// ============================================

export type ClinicalRecord = {
  id: string;
  patient_id: string;
  therapist_id: string;
  appointment_id: string | null;
  session_date: string;
  session_number: number;
  chief_complaint: string | null;
  notes: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  observations: string | null;
  mood_state: string | null;
  progress_notes: string | null;
  next_session_goals: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalRecordWithRelations = ClinicalRecord & {
  patient?: Patient;
  therapist?: Therapist;
  appointment?: Appointment | null;
  attachments?: ClinicalAttachment[];
};

export type ClinicalAttachment = {
  id: string;
  clinical_record_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
};

// ============================================
// Evaluations
// ============================================

export type Evaluation = {
  id: string;
  appointment_id: string;
  therapist_id: string;
  patient_id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
};

export type EvaluationWithRelations = Evaluation & {
  appointment?: Appointment;
  therapist?: Therapist;
  patient?: Patient;
};

// ============================================
// Team Management
// ============================================

export type TeamMemberRole = "staff" | "receptionist" | "admin" | "super_admin";

export type TeamMember = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: TeamMemberRole;
  phone: string | null;
  salary: number | null;
  hire_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// Calendar Types
// ============================================

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  patient?: Patient;
  therapist?: Therapist;
  branch?: Branch | null;
  appointment: Appointment;
};
