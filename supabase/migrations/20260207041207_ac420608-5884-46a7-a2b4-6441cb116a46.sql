
-- Add missing JVS areas: ÚV Plav, VDJ Včelná, VDJ Amerika
-- Source: JVS_rozmery_ploch.pdf + Kopie JVS OPRAVA METRŮ

INSERT INTO public.arealy (nazev, typ, plocha_m2, obvod_oploceni_m, gps_latitude, gps_longitude, okres, kategorie_travnate_plochy, google_maps_link, poznamky) VALUES
('ÚV Plav', 'úpravna vody', 74777, 1245, 48.941623, 14.437891, 'CB', 'I.', 'https://maps.google.com/?q=48.941623,14.437891', 'Úpravna vody – hlavní areál'),
('VDJ Včelná', 'vodojem', 8660, 456, 48.962345, 14.458901, 'CB', 'II.', 'https://maps.google.com/?q=48.962345,14.458901', 'Vodojem Včelná – Kategorie II'),
('VDJ Amerika', 'vodojem', 4210, 315, 49.305131, 14.166126, 'PI', 'II.', 'https://maps.google.com/?q=49.305131,14.166126', 'Autentické GPS souřadnice z Oprava metrů PDF')
ON CONFLICT DO NOTHING;
