-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for usage_logs table
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update orders" ON public.orders
  FOR UPDATE USING (true);

-- RLS Policies for affiliates table
CREATE POLICY "Affiliates can view their own data" ON public.affiliates
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Anyone can insert affiliate registration" ON public.affiliates
  FOR INSERT WITH CHECK (true);

-- RLS Policies for commissions table
CREATE POLICY "Affiliates can view their own commissions" ON public.commissions
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for admin_users table (only admins can access)
CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING (false); -- Will be handled by service role

CREATE POLICY "Only admins can insert admin users" ON public.admin_users
  FOR INSERT WITH CHECK (false); -- Will be handled by service role
