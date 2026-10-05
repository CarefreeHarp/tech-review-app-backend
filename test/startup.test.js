import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const initializerNames = [...source.matchAll(/import \{ (initialize\w+) \}/g)].map((match) => match[1]);

/** Ejecuta el arranque real con persistencia simulada, sin conectar con PostgreSQL. */
async function runStartup(args, failSync = false) {
  const events = [];
  const context = {
    process: { argv: ["node", "src/index.js", ...args] },
    console: { log() {}, error() {} },
    setupRelations() { events.push("relations"); },
    sequelize: {
      async authenticate() { events.push("authenticate"); },
      async sync({ force }) {
        events.push({ force });
        if (failSync) throw new Error("Synchronization failed");
      },
      async transaction(callback) {
        events.push("transaction");
        await callback({});
      },
    },
    app: { listen(port) { events.push({ port }); } },
  };
  for (const name of initializerNames) {
    context[name] = async () => { events.push(name); return []; };
  }
  // Sustituye únicamente imports y la invocación automática para inyectar dobles controlados.
  const script = source.replace(/^import .*;\s*$/gm, "").replace(/\ninit\(\);\s*$/, "\nglobalThis.start = init;");
  vm.runInNewContext(script, context);
  await context.start();
  return { events, exitCode: context.process.exitCode };
}

test("El arranque normal conserva datos y carga los init antes de escuchar", async () => {
  const { events, exitCode } = await runStartup([]);
  assert.deepEqual(events, ["authenticate", "relations", { force: false }, "transaction", ...initializerNames, { port: 3000 }]);
  assert.equal(exitCode, undefined);
});

test("Solo --reset-db recrea las tablas antes de cargar los init", async () => {
  const { events } = await runStartup(["--reset-db"]);
  assert.deepEqual(events, ["authenticate", "relations", { force: true }, "transaction", ...initializerNames, { port: 3000 }]);
  const normal = await runStartup(["--other-option"]);
  assert.deepEqual(normal.events[2], { force: false });
});

test("Si falla la sincronización, no carga ejemplos ni arranca el servidor", async () => {
  const { events, exitCode } = await runStartup(["--reset-db"], true);
  assert.deepEqual(events, ["authenticate", "relations", { force: true }]);
  assert.equal(exitCode, 1);
});
