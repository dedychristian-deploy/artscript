const net = require("net");
const http = require("http");

/* ======================
   VIZ CLIENT
====================== */
class Viz {
  constructor() {
    this.client = null;
    this.host = null;
    this.port = null;
    this.isConnected = false;
  }

  new(host, port) {
    this.host = host;
    this.port = parseInt(port, 10);
  }

  async connect() {
    if (this.isConnected && this.client) return;

    return new Promise((resolve, reject) => {
      this.client = new net.Socket();
      this.client.setNoDelay(true);

      this.client.connect(this.port, this.host, () => {
        this.isConnected = true;
        console.log("Connected to Viz Engine", this.host, this.port);
        resolve();
      });

      this.client.on("data", d => {
        //console.log("Viz:", d.toString());
      });

      this.client.on("close", () => {
        console.log("Viz connection closed");
        this.isConnected = false;
        this.client = null;
      });

      this.client.on("error", err => {
        console.error("Viz error:", err.message);
        this.isConnected = false;
        this.client = null;
        reject(err);
      });
    });
  }

  sendCommand(command) {
    if (!this.isConnected || !this.client) {
      console.log("Viz not connected");
      return;
    }

    // 🔥 
    const payload = Buffer.concat([
      Buffer.from(command, "utf8"),
      Buffer.from([0])
    ]);

    this.client.write(payload);
  }
}

const viz = new Viz();

/* ======================
   HTTP SERVER
====================== */
http.createServer(async (req, res) => {
  // ===== CORS =====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const u = new URL(req.url, "http://localhost");
  const host = u.searchParams.get("host");
  const port = u.searchParams.get("port");
  const cmd  = u.searchParams.get("cmd");

  res.setHeader("Content-Type", "application/json");

  if (!host || !port || !cmd) {
    res.end(JSON.stringify({ ok: false, error: "MISSING_PARAM" }));
    return;
  }

  try {
    // 
    viz.new(host, port);
    await viz.connect();

    const command = decodeURIComponent(cmd);

    // 
    setTimeout(() => {
      viz.sendCommand(command);
    }, 300);

    res.end(JSON.stringify({
      ok: true,
      host,
      port: +port,
      command
    }));

  } catch (e) {
    res.end(JSON.stringify({
      ok: false,
      error: e.message
    }));
  }

}).listen(8080, () => {
  console.log("Viz Web Server running on 8080");
});
