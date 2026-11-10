-- Cambio aditivo: guarda si el usuario verificó su correo para mostrar la palomita en la app.
-- Los perfiles existentes quedan sin verificar hasta que la app confirme la verificación con Firebase Auth.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
