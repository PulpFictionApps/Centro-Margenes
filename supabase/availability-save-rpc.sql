-- RPC function to save availability bypassing PostgREST schema cache
CREATE OR REPLACE FUNCTION save_therapist_availability(
  p_therapist_id UUID,
  p_slots JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller owns this therapist profile
  IF NOT EXISTS (
    SELECT 1 FROM therapists
    WHERE id = p_therapist_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM availability WHERE therapist_id = p_therapist_id;

  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    INSERT INTO availability (therapist_id, day_of_week, start_time, end_time, slot_duration, modality)
    SELECT
      p_therapist_id,
      (s->>'day_of_week')::integer,
      (s->>'start_time')::time,
      (s->>'end_time')::time,
      COALESCE((s->>'slot_duration')::integer, 50),
      COALESCE(s->>'modality', 'both')
    FROM jsonb_array_elements(p_slots) AS s;
  END IF;
END;
$$;
