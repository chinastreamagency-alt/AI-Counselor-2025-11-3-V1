-- Function to update affiliate settlement amounts
CREATE OR REPLACE FUNCTION update_affiliate_settlement(
  p_affiliate_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.affiliates
  SET 
    settled_commission = settled_commission + p_amount,
    unsettled_commission = unsettled_commission - p_amount,
    updated_at = NOW()
  WHERE id = p_affiliate_id;
END;
$$;
