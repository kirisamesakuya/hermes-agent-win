import net from "node:net";
import { findFreePort } from "./webui/ports.js";

const occupiedPort = 8787;
const server = net.createServer();

server.once("error", (error) => {
  console.error(`failed to bind test port ${occupiedPort}: ${error.message}`);
  process.exit(1);
});

server.listen(occupiedPort, "127.0.0.1", async () => {
  try {
    const port = await findFreePort(occupiedPort);
    if (port === occupiedPort) {
      console.error(`findFreePort returned occupied port ${occupiedPort}`);
      process.exitCode = 1;
      return;
    }
    console.log(`ok: occupied ${occupiedPort}, selected ${port}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
