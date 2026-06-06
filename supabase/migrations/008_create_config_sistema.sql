CREATE TABLE IF NOT EXISTS config_sistema (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre_sistema TEXT NOT NULL DEFAULT 'SGJA',
  subtitulo TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  favicon_url TEXT,
  licencia TEXT,
  autoria TEXT,
  otros_datos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO config_sistema (id, nombre_sistema, version)
VALUES (1, 'SGJA', '1.0.0')
ON CONFLICT (id) DO NOTHING;
