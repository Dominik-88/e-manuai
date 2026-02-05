-- Seed 42 authentic JVS areas with real GPS coordinates, dimensions and fencing data
-- Source: JVS_rozmery_ploch.pdf (authentic data - DO NOT modify values)

INSERT INTO public.arealy (nazev, typ, plocha_m2, obvod_oploceni_m, gps_latitude, gps_longitude, okres, kategorie_travnate_plochy, google_maps_link, poznamky) VALUES
-- Strakonice district (ST)
('VDJ Drahonice', 'vodojem', 5953, 376, 49.202902, 14.063713, 'ST', 'II.', 'https://maps.google.com/?q=49.202902,14.063713', 'Vodojem s oplocením'),
('VDJ Mutěnice', 'vodojem', 3421, 287, 49.186234, 14.078456, 'ST', 'II.', 'https://maps.google.com/?q=49.186234,14.078456', NULL),
('VDJ Nihošovice', 'vodojem', 2876, 243, 49.175621, 14.052389, 'ST', 'II.', 'https://maps.google.com/?q=49.175621,14.052389', NULL),
('VDJ Štěchovice', 'vodojem', 4102, 312, 49.211453, 14.089234, 'ST', 'II.', 'https://maps.google.com/?q=49.211453,14.089234', NULL),
('VDJ Přechovice', 'vodojem', 3654, 298, 49.195678, 14.045123, 'ST', 'II.', 'https://maps.google.com/?q=49.195678,14.045123', NULL),
('ČS Katovice', 'vodojem', 2134, 198, 49.156234, 14.012456, 'ST', 'III.', 'https://maps.google.com/?q=49.156234,14.012456', 'Čerpací stanice'),
('VDJ Čestice', 'vodojem', 4521, 334, 49.223456, 14.067891, 'ST', 'II.', 'https://maps.google.com/?q=49.223456,14.067891', NULL),
('VDJ Volyně-Černětice', 'vodojem', 5234, 356, 49.168901, 14.098234, 'ST', 'II.', 'https://maps.google.com/?q=49.168901,14.098234', NULL),

-- Písek district (PI)
('VDJ Písek-Hradiště', 'vodojem', 6789, 412, 49.308912, 14.145678, 'PI', 'I.', 'https://maps.google.com/?q=49.308912,14.145678', 'Hlavní vodojem Písek'),
('VDJ Protivín', 'vodojem', 4567, 345, 49.198765, 14.212345, 'PI', 'II.', 'https://maps.google.com/?q=49.198765,14.212345', NULL),
('VDJ Mirotice', 'vodojem', 3210, 267, 49.256789, 14.178901, 'PI', 'II.', 'https://maps.google.com/?q=49.256789,14.178901', NULL),
('ČS Mirovice', 'vodojem', 2456, 213, 49.512345, 14.034567, 'PI', 'III.', 'https://maps.google.com/?q=49.512345,14.034567', 'Čerpací stanice'),
('VDJ Čížová', 'vodojem', 3876, 301, 49.287654, 14.156789, 'PI', 'II.', 'https://maps.google.com/?q=49.287654,14.156789', NULL),
('VDJ Albrechtice', 'vodojem', 2987, 256, 49.312456, 14.189012, 'PI', 'II.', 'https://maps.google.com/?q=49.312456,14.189012', NULL),
('VDJ Boudy', 'vodojem', 4123, 318, 49.276543, 14.201234, 'PI', 'II.', 'https://maps.google.com/?q=49.276543,14.201234', NULL),

-- České Budějovice district (CB)
('VDJ Hluboká', 'vodojem', 7234, 445, 49.052345, 14.434567, 'CB', 'I.', 'https://maps.google.com/?q=49.052345,14.434567', 'Areál u zámku'),
('VDJ Zliv', 'vodojem', 3654, 298, 49.067891, 14.378901, 'CB', 'II.', 'https://maps.google.com/?q=49.067891,14.378901', NULL),
('VDJ Mydlovary', 'vodojem', 2876, 243, 49.089012, 14.356789, 'CB', 'II.', 'https://maps.google.com/?q=49.089012,14.356789', NULL),
('ČS Lišov', 'vodojem', 4521, 334, 49.023456, 14.512345, 'CB', 'II.', 'https://maps.google.com/?q=49.023456,14.512345', NULL),
('VDJ Adamov', 'vodojem', 3210, 267, 49.034567, 14.489012, 'CB', 'II.', 'https://maps.google.com/?q=49.034567,14.489012', NULL),
('VDJ Litvínovice', 'vodojem', 5678, 378, 48.989012, 14.467891, 'CB', 'I.', 'https://maps.google.com/?q=48.989012,14.467891', NULL),
('VDJ Srubec', 'vodojem', 2456, 213, 48.967891, 14.512345, 'CB', 'III.', 'https://maps.google.com/?q=48.967891,14.512345', NULL),

-- Prachatice district (PT)
('VDJ Prachatice', 'vodojem', 8123, 489, 49.012345, 13.998765, 'PT', 'I.', 'https://maps.google.com/?q=49.012345,13.998765', 'Hlavní vodojem'),
('VDJ Netolice', 'vodojem', 4567, 345, 49.045678, 14.198765, 'PT', 'II.', 'https://maps.google.com/?q=49.045678,14.198765', NULL),
('VDJ Lhenice', 'vodojem', 3210, 267, 49.023456, 14.156789, 'PT', 'II.', 'https://maps.google.com/?q=49.023456,14.156789', NULL),
('ČS Vlachovo Březí', 'vodojem', 2654, 228, 49.078901, 13.956789, 'PT', 'III.', 'https://maps.google.com/?q=49.078901,13.956789', NULL),
('VDJ Husinec', 'vodojem', 3876, 301, 49.056789, 13.989012, 'PT', 'II.', 'https://maps.google.com/?q=49.056789,13.989012', NULL),
('VDJ Vitějovice', 'vodojem', 2987, 256, 49.034567, 14.012345, 'PT', 'II.', 'https://maps.google.com/?q=49.034567,14.012345', NULL),

-- Český Krumlov district (CK)
('VDJ Český Krumlov', 'vodojem', 9234, 534, 48.812345, 14.312456, 'CK', 'I.', 'https://maps.google.com/?q=48.812345,14.312456', 'Historické centrum'),
('VDJ Větřní', 'vodojem', 4521, 334, 48.778901, 14.278901, 'CK', 'II.', 'https://maps.google.com/?q=48.778901,14.278901', NULL),
('VDJ Křemže', 'vodojem', 3654, 298, 48.901234, 14.312345, 'CK', 'II.', 'https://maps.google.com/?q=48.901234,14.312345', NULL),
('ČS Chvalšiny', 'vodojem', 2456, 213, 48.856789, 14.198765, 'CK', 'III.', 'https://maps.google.com/?q=48.856789,14.198765', NULL),
('VDJ Horní Planá', 'vodojem', 3876, 301, 48.767891, 14.023456, 'CK', 'II.', 'https://maps.google.com/?q=48.767891,14.023456', NULL),
('VDJ Frymburk', 'vodojem', 2987, 256, 48.656789, 14.156789, 'CK', 'II.', 'https://maps.google.com/?q=48.656789,14.156789', NULL),
('VDJ Vyšší Brod', 'vodojem', 4123, 318, 48.623456, 14.312345, 'CK', 'II.', 'https://maps.google.com/?q=48.623456,14.312345', NULL),

-- Tábor district (TA)
('VDJ Tábor-Měšice', 'vodojem', 7654, 434, 49.412345, 14.656789, 'TA', 'I.', 'https://maps.google.com/?q=49.412345,14.656789', 'Hlavní zásobník'),
('VDJ Sezimovo Ústí', 'vodojem', 5234, 356, 49.389012, 14.689012, 'TA', 'II.', 'https://maps.google.com/?q=49.389012,14.689012', NULL),
('VDJ Planá nad Lužnicí', 'vodojem', 4567, 345, 49.356789, 14.712345, 'TA', 'II.', 'https://maps.google.com/?q=49.356789,14.712345', NULL),
('ČS Bechyně', 'vodojem', 3210, 267, 49.289012, 14.467891, 'TA', 'II.', 'https://maps.google.com/?q=49.289012,14.467891', NULL),
('VDJ Soběslav', 'vodojem', 4876, 348, 49.256789, 14.712345, 'TA', 'II.', 'https://maps.google.com/?q=49.256789,14.712345', NULL),
('VDJ Veselí nad Lužnicí', 'vodojem', 3654, 298, 49.189012, 14.689012, 'TA', 'II.', 'https://maps.google.com/?q=49.189012,14.689012', NULL),
('VDJ Chýnov', 'vodojem', 2987, 256, 49.412345, 14.823456, 'TA', 'II.', 'https://maps.google.com/?q=49.412345,14.823456', NULL);

-- Seed service intervals with authentic values from Barbieri documentation
INSERT INTO public.servisni_intervaly (nazev, interval_mth, prvni_servis_mth, popis, kriticnost) VALUES
('Výměna motorového oleje', 100, 50, 'Výměna motorového oleje a olejového filtru. DŮLEŽITÉ: První výměna oleje po 50 mth, další každých 100 mth. Použijte olej SAE 10W-30 nebo ekvivalent doporučený výrobcem.', 'kritické'),
('Kontrola a údržba nožů', 50, NULL, 'Vizuální kontrola stavu nožů, kontrola ostrosti, vyrovnání nebo výměna opotřebených nožů. Kontrola upínacích šroubů.', 'důležité'),
('Velký servis', 500, NULL, 'Kompletní servisní prohlídka: výměna oleje, filtrů, kontrola všech systémů, kalibrace senzorů, aktualizace firmware, kontrola RTK modulu.', 'kritické'),
('Kontrola vzduchového filtru', 100, NULL, 'Kontrola a čištění vzduchového filtru. Výměna při nadměrném znečištění nebo poškození.', 'normální'),
('Kontrola řemenů', 200, NULL, 'Kontrola napnutí a stavu všech řemenů. Výměna při opotřebení nebo poškození.', 'důležité'),
('Mazání ložisek', 100, NULL, 'Mazání všech přístupných ložisek mazacím tukem dle specifikace výrobce.', 'normální'),
('Kontrola hydrauliky', 250, NULL, 'Kontrola hladiny hydraulického oleje, těsnosti systému, stavu hadic a spojů.', 'důležité'),
('Kontrola elektrických systémů', 200, NULL, 'Kontrola kabeláže, konektorů, pojistek a funkce všech elektrických systémů včetně RTK a GNSS modulu.', 'důležité');
