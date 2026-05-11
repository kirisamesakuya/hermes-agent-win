import fs from "node:fs";
import path from "node:path";

export class LogBuffer {
  private readonly chunks: string[] = [];
  private readonly maxChunks = 2000;

  constructor(private readonly filePath: string) {}

  append(text: string): void {
    if (!text) return;
    this.chunks.push(text);
    while (this.chunks.length > this.maxChunks) this.chunks.shift();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.appendFileSync(this.filePath, text, "utf8");
  }

  tail(lines = 200): string {
    const normalized = Math.min(Math.max(lines, 1), 2000);
    if (fs.existsSync(this.filePath)) {
      const text = fs.readFileSync(this.filePath, "utf8");
      return text.split(/\r?\n/).slice(-normalized).join("\n");
    }
    return this.chunks.join("").split(/\r?\n/).slice(-normalized).join("\n");
  }
}
