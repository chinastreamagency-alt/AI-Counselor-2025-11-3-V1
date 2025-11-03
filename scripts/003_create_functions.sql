-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user's total and used hours
CREATE OR REPLACE FUNCTION public.update_user_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- Add purchased hours to user's total
    UPDATE public.users
    SET total_hours = total_hours + NEW.hours_purchased,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update user hours when order is completed
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_user_hours();

-- Function to calculate and create commission
CREATE OR REPLACE FUNCTION public.create_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_affiliate_id UUID;
  v_commission_rate DECIMAL(5, 2);
  v_commission_amount DECIMAL(10, 2);
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.affiliate_id IS NOT NULL THEN
    -- Get affiliate commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM public.affiliates
    WHERE id = NEW.affiliate_id;
    
    -- Calculate commission amount
    v_commission_amount := NEW.amount * (v_commission_rate / 100);
    
    -- Create commission record
    INSERT INTO public.commissions (affiliate_id, order_id, amount, status)
    VALUES (NEW.affiliate_id, NEW.id, v_commission_amount, 'pending');
    
    -- Update affiliate's total and unsettled commission
    UPDATE public.affiliates
    SET total_commission = total_commission + v_commission_amount,
        unsettled_commission = unsettled_commission + v_commission_amount,
        updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to create commission when order is completed
DROP TRIGGER IF EXISTS on_order_completed_commission ON public.orders;
CREATE TRIGGER on_order_completed_commission
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.affiliate_id IS NOT NULL)
  EXECUTE FUNCTION public.create_commission();

-- Function to update usage hours
CREATE OR REPLACE FUNCTION public.update_usage_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.session_end IS NOT NULL AND NEW.session_start IS NOT NULL THEN
      -- Calculate duration in minutes and hours
      NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
      NEW.duration_hours := CEIL(NEW.duration_minutes / 60.0); -- Round up to nearest hour
      
      -- Update user's used hours
      UPDATE public.users
      SET used_hours = used_hours + NEW.duration_hours,
          updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to calculate usage hours
DROP TRIGGER IF EXISTS on_usage_log_updated ON public.usage_logs;
CREATE TRIGGER on_usage_log_updated
  BEFORE INSERT OR UPDATE ON public.usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usage_hours();
