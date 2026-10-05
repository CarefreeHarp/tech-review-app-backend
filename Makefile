.PHONY: dev dev-reset

# Conserva los registros y reinicia el servidor cuando cambia el código.
dev:
	npm run dev

# Recrea las tablas y carga los init una sola vez, sin reinicios de nodemon.
dev-reset:
	node src/index.js --reset-db
