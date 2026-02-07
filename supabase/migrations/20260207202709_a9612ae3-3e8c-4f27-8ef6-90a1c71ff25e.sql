DROP POLICY "Authenticated users can view servisni_zaznamy" ON servisni_zaznamy;
CREATE POLICY "Authenticated users can view servisni_zaznamy"
  ON servisni_zaznamy FOR SELECT TO authenticated
  USING (true);