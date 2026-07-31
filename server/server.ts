import "dotenv/config";

import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`
🚀 Districorp ERP API iniciado correctamente

🌐 Puerto: ${env.PORT}
🛡️ Ambiente: ${process.env.NODE_ENV ?? "development"}
`);
});
