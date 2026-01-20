// Template script goes here
const listener = "http://127.0.0.1:8080/command";
const host = "127.0.0.1";
const port = 6100;

function sendCommand(cmd: string) {
  const url =
    listener +
    "?host=" + host +
    "&port=" + port +
    "&cmd=" + encodeURIComponent(cmd);

  void fetch(url).catch(() => {});
}

function getFieldValue(value: any): string {
  if (value == null) return "";
  return String(value);
}



vizrt.onClick = (name: string) => {
  switch(name) {
    case "take":
        sendCommand("0 RENDERER*STAGE*DIRECTOR*Default SHOW 0");
        sendCommand("0 RENDERER*STAGE*DIRECTOR*Default CONTINUE");
        break
    case "out":
        sendCommand(getFieldValue(vizrt.fields.$CMD.value));
        break
  }
}