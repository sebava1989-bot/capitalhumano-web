-- Columna para rastrear quién refirió al cliente (referral_code del referidor)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referred_by_code text;
