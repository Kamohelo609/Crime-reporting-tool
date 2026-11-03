-- ============================================================
--  SafetyConnect — MySQL / MariaDB schema + demo seed data
--  Target: XAMPP MySQL (MariaDB 10.4) on localhost:3306
--
--  Import with:
--    "C:/xampp/mysql/bin/mysql.exe" -u root < database.sql
--  (or run it from the XAMPP phpMyAdmin SQL tab)
-- ============================================================

CREATE DATABASE IF NOT EXISTS safetyconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE safetyconnect;

-- ------------------------------------------------------------
--  Table: users  (citizens + police officers)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS report_updates;
DROP TABLE IF EXISTS report_media;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS station_units;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120)  NOT NULL,
  phone         VARCHAR(30)   DEFAULT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('citizen','officer') NOT NULL DEFAULT 'citizen',
  badge         VARCHAR(20)   DEFAULT NULL UNIQUE,   -- officers only, e.g. '#4021'
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Table: stations
-- ------------------------------------------------------------
CREATE TABLE stations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(10)  NOT NULL UNIQUE,   -- 'ST-01'
  name       VARCHAR(120) NOT NULL,
  lat        DECIMAL(10,6) NOT NULL,
  lng        DECIMAL(10,6) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE station_units (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  unit_name  VARCHAR(40) NOT NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Table: reports  (incident reports)
-- ------------------------------------------------------------
CREATE TABLE reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ref_id        VARCHAR(20)  NOT NULL UNIQUE,          -- 'INC-1021'
  token         VARCHAR(24)  NOT NULL UNIQUE,          -- 'REP-8921-X' (tracking token)
  category      VARCHAR(40)  NOT NULL,
  description   TEXT         NOT NULL,
  lat           DECIMAL(10,6) NOT NULL,
  lng           DECIMAL(10,6) NOT NULL,
  address       VARCHAR(160) DEFAULT NULL,
  status        ENUM('Pending','Received','Assigned','In Progress','Under Investigation','Resolved')
                 NOT NULL DEFAULT 'Pending',
  anonymous     TINYINT(1)   NOT NULL DEFAULT 1,
  reporter_type ENUM('Anonymous','Registered') NOT NULL DEFAULT 'Anonymous',
  user_id       INT          DEFAULT NULL,
  station_id    INT          DEFAULT NULL,            -- nearest / chosen police station
  latest_update VARCHAR(255) NOT NULL DEFAULT 'Report received',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  INDEX idx_reports_token (token),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created (created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Table: report_media  (uploaded evidence files)
-- ------------------------------------------------------------
CREATE TABLE report_media (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  report_id     INT NOT NULL,
  media_type    ENUM('image','video') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path     VARCHAR(255) NOT NULL,     -- '/uploads/images/....'
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Table: report_updates  (dispatch / case history)
-- ------------------------------------------------------------
CREATE TABLE report_updates (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  report_id  INT NOT NULL,
  note       VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  SEED DATA
-- ============================================================

-- ---------- demo accounts ----------
--  Officer : j.doe@precinct12.gov  / badge #4021 / password: officer123
--  Citizen : thabo@example.com     / password: citizen123
INSERT INTO users (id, full_name, phone, email, password_hash, role, badge) VALUES
  (1, 'J. Doe',    '+266 2231 4021', 'j.doe@precinct12.gov',
   '$2y$10$i49JkrNBdz7b938otw8/SuV7ANoKMfSNwg4MRjcRg.41FEccXWx5m', 'officer', '#4021'),
  (2, 'Thabo Nkosi', '+266 5812 3456', 'thabo@example.com',
   '$2y$10$fz9UX3weurR5q2jcs.un6.zC9Ox88T9GGk5BO7aD9o4t8Au.6l2FW', 'citizen', NULL);
ALTER TABLE users AUTO_INCREMENT = 10;

-- ---------- stations (all 10 districts of Lesotho) ----------
INSERT INTO stations (id, code, name, lat, lng) VALUES
  (1,  'ST-01', 'Maseru Central Police Station',              -29.314200, 27.483300),
  (2,  'ST-02', 'Maseru Police Headquarters',                 -29.312000, 27.477000),
  (3,  'ST-03', 'Police Training College Police Station',     -29.329880, 27.482510),
  (4,  'ST-04', 'Maseru Mall Police Station',                 -29.334870, 27.485170),
  (5,  'ST-05', 'Hoohlo Police Station',                      -29.296100, 27.475650),
  (6,  'ST-06', 'Thamae Police Station',                      -29.328560, 27.516120),
  (7,  'ST-07', 'Lithoteng Police Station',                   -29.363330, 27.511370),
  (8,  'ST-08', 'Mabote Police Station',                      -29.294380, 27.533160),
  (9,  'ST-09', 'Maseru Rural (Mazenod) Police Station',      -29.416180, 27.559220),
  (10, 'ST-10', 'Roma Police Post',                           -29.455810, 27.722990),
  (11, 'ST-11', 'Morija Police Station',                      -29.627580, 27.501910),
  (12, 'ST-12', 'Thaba Bosiu Police Post',                    -29.344080, 27.669600),
  (13, 'ST-13', 'Semonkong Police Post',                      -29.845970, 28.051140),
  (14, 'ST-14', 'Nyakosoba Police Post',                      -29.524450, 27.773420),
  (15, 'ST-15', 'Marakabei Police Post',                      -29.542360, 28.137790),
  (16, 'ST-16', 'Berea Police Station (Teyateyaneng)',        -29.146020, 27.740630),
  (17, 'ST-17', 'Mapoteng Police Post',                       -29.115120, 27.972740),
  (18, 'ST-18', 'Peka Police Station',                        -28.971940, 27.764030),
  (19, 'ST-19', 'Ha Foso Police Post',                        -29.269590, 27.574040),
  (20, 'ST-20', 'Hlotse Police Station',                      -28.870820, 28.041890),
  (21, 'ST-21', 'Maputsoe Border Post Police Station',        -28.885860, 27.892430),
  (22, 'ST-22', 'Pitseng Police Station',                     -29.001200, 28.211400),
  (23, 'ST-23', 'Thaba Phatsoa Police Station',               -28.988230, 28.139780),
  (24, 'ST-24', 'Butha-Buthe Police Station',                 -28.762990, 28.246460),
  (25, 'ST-25', 'Qholaqhoe Police Station',                   -28.643130, 28.449480),
  (26, 'ST-26', 'Qalo Police Station',                        -28.697690, 28.341300),
  (27, 'ST-27', 'Joels Drift Police Post',                    -28.690000, 28.310000),
  (28, 'ST-28', 'Ts''akholo Police Post',                     -28.762400, 28.672600),
  (29, 'ST-29', 'Mafeteng Police Station',                    -29.823030, 27.241340),
  (30, 'ST-30', 'Matelile Police Station',                    -29.816780, 27.512460),
  (31, 'ST-31', 'Mohale''s Hoek Police Station',              -30.151560, 27.476260),
  (32, 'ST-32', 'Mpharane Police Station',                    -30.000310, 27.577280),
  (33, 'ST-33', 'Liphiring Police Station',                   -30.126990, 27.325100),
  (34, 'ST-34', 'Quthing (Moyeni) Police Station',            -30.401620, 27.705670),
  (35, 'ST-35', 'Mount Moorosi Police Post',                  -30.274320, 27.873130),
  (36, 'ST-36', 'Mphaki Police Station',                      -30.190440, 28.128390),
  (37, 'ST-37', 'Tele Police Post',                           -30.615190, 27.888020),
  (38, 'ST-38', 'Dilli-Dilli Police Station',                 -30.526510, 27.668770),
  (39, 'ST-39', 'Qacha''s Nek Police Station',                -30.113330, 28.681100),
  (40, 'ST-40', 'Sekake Police Station',                      -30.048810, 28.363300),
  (41, 'ST-41', 'Mokhotlong Police Station',                  -29.289420, 29.063170),
  (42, 'ST-42', 'Mapholaneng Police Station',                 -29.200450, 28.862910),
  (43, 'ST-43', 'Sehonghong Police Post',                     -29.498910, 29.299130),
  (44, 'ST-44', 'Thaba-Tseka Police Station',                 -29.515180, 28.603620),
  (45, 'ST-45', 'Mantsonyane Police Post',                    -29.533910, 28.267820),
  (46, 'ST-46', 'Sani Top Border Police Station',             -29.584710, 29.285440);

INSERT INTO station_units (station_id, unit_name)
  SELECT id, CONCAT('Unit ', id * 2 - 1) FROM stations;
INSERT INTO station_units (station_id, unit_name)
  SELECT id, CONCAT('Unit ', id * 2) FROM stations;

-- ---------- sample incidents (ids 21-26 => refs INC-1021..INC-1026) ----------
INSERT INTO reports
  (id, ref_id, token, category, description, lat, lng, address, status,
   anonymous, reporter_type, user_id, station_id, latest_update, created_at)
VALUES
  (21, 'INC-1021', 'REP-8921-X', 'Theft',
   'Two suspects seen breaking into a parked vehicle outside the mall entrance by Kingsway Road. Suspects fled on foot towards the bus ranks.',
   -29.310500, 27.487900, 'Kingsway & Pioneer Road', 'Under Investigation',
   1, 'Anonymous', NULL, 1, 'Patrol unit 4 dispatched to the scene', NOW() - INTERVAL 8 MINUTE),

  (22, 'INC-1022', 'REP-4471-A', 'Vandalism',
   'Graffiti sprayed on the side wall of the community library near Pitso Ground. Suspects wearing dark hoodies seen around 6:40 AM.',
   -29.304100, 27.475200, 'Moshoeshoe & Constitution Road', 'Assigned',
   0, 'Registered', 2, 5, 'Case assigned to Detective K. Mokoena', NOW() - INTERVAL 5 MINUTE),

  (23, 'INC-1023', 'REP-9983-B', 'Theft',
   'Snatch and run incident near Manthabiseng Convention Centre; victim reports phone and wallet taken.',
   -29.322000, 27.471200, 'Main North & Airport Road', 'Pending',
   1, 'Anonymous', NULL, 1, 'Awaiting unit assignment', NOW() - INTERVAL 2 MINUTE),

  (24, 'INC-1024', 'REP-1120-C', 'Assault',
   'Physical altercation outside a tavern along the Main South Road, one person injured, security intervened.',
   -29.318500, 27.503100, 'Kofi Annan & Lindi Road', 'In Progress',
   0, 'Registered', 2, 6, 'Patrol unit 2 en route, ETA 4 minutes', NOW() - INTERVAL 3 MINUTE),

  (25, 'INC-1025', 'REP-3340-D', 'Burglary',
   'Break-in at a corner store near the Pioneer Road turnoff overnight; cash register emptied.',
   -29.299400, 27.456700, 'St. Germain & Naledi Road', 'Resolved',
   1, 'Anonymous', NULL, 5, 'Case resolved, suspect arrested', NOW() - INTERVAL 95 MINUTE),

  (26, 'INC-1026', 'REP-7654-E', 'Vandalism',
   'Streetlight smashed near the taxi rank on the outskirts of the CBD; glass scattered on the sidewalk.',
   -29.330200, 27.493900, 'Highlands & Motsoene Road', 'Pending',
   1, 'Anonymous', NULL, 4, 'Report received', NOW() - INTERVAL 1 MINUTE);
ALTER TABLE reports AUTO_INCREMENT = 27;

-- ---------- sample evidence ----------
INSERT INTO report_media (report_id, media_type, original_name, file_path) VALUES
  (21, 'image', 'IMG_2311.PNG', '/uploads/images/seed-1021.png'),
  (22, 'image', 'IMG_2290.PNG', '/uploads/images/seed-1022.png'),
  (23, 'video', 'VID_005.MP4',  '/uploads/videos/seed-1023.mp4'),
  (24, 'video', 'VID_018.MP4',  '/uploads/videos/seed-1024.mp4'),
  (24, 'image', 'IMG_2300.PNG', '/uploads/images/seed-1024.png'),
  (25, 'image', 'IMG_2277.PNG', '/uploads/images/seed-1025.png'),
  (26, 'image', 'IMG_2320.PNG', '/uploads/images/seed-1026.png');

-- ---------- case history ----------
INSERT INTO report_updates (report_id, note, created_at) VALUES
  (21, 'Report received',                      NOW() - INTERVAL 8 MINUTE),
  (21, 'Patrol unit 4 dispatched to the scene', NOW() - INTERVAL 6 MINUTE),
  (22, 'Report received',                       NOW() - INTERVAL 5 MINUTE),
  (22, 'Case assigned to Detective K. Mokoena', NOW() - INTERVAL 4 MINUTE),
  (23, 'Report received',                       NOW() - INTERVAL 2 MINUTE),
  (23, 'Awaiting unit assignment',              NOW() - INTERVAL 2 MINUTE),
  (24, 'Report received',                       NOW() - INTERVAL 3 MINUTE),
  (24, 'Patrol unit 2 en route, ETA 4 minutes', NOW() - INTERVAL 2 MINUTE),
  (25, 'Report received',                       NOW() - INTERVAL 95 MINUTE),
  (25, 'Case resolved, suspect arrested',       NOW() - INTERVAL 40 MINUTE),
  (26, 'Report received',                       NOW() - INTERVAL 1 MINUTE);
