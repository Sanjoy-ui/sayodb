#!/usr/bin/env node

import net from "node:net";
import tls from "node:tls";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Command } from "commander";
import { ClientRESPParser, RESPType } from "./protocol/parser.js";
import { formatRESPValue } from "./formatter.js";

const program = new Command();

program
  .name("sayodb-cli")
  .description("Interactive terminal CLI client for sayoDB in-memory database")
  .option("-h, --host <host>", "sayoDB server host", process.env.SAYODB_HOST || "127.0.0.1")
  .option("-p, --port <port>", "sayoDB server port", process.env.SAYODB_PORT || "6380")
  .option("-a, --password <password>", "Authentication password")
  .option("--tls", "Establish an encrypted TLS/SSL connection", process.env.SAYODB_TLS === "true" || process.env.SAYODB_TLS === "yes" || false)
  .option("--insecure", "Disable strict TLS certificate verification (for self-signed certs)", false)
  .option("--tls-ca <path>", "Path to custom CA certificate file")
  .option("--raw", "Print raw unformatted output", false)
  .allowUnknownOption(true)
  .argument("[command...]", "Single command to run")
  .action((commandArgs, options) => {
    const host = options.host;
    const port = parseInt(options.port, 10);
    const rawMode = options.raw;
    const tlsOpts = {
      tls: options.tls,
      insecure: options.insecure,
      ca: options.tlsCa,
    };

    const password = options.password || process.env.SAYODB_PASSWORD;
    const extraArgs = program.args;

    if (extraArgs.length > 0) {
      runSingleCommand(host, port, extraArgs, rawMode, password, tlsOpts);
    } else {
      runRepl(host, port, rawMode, password, tlsOpts);
    }
  });

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  program.parse(process.argv);
}

function buildRESPBuffer(args: string[]): Buffer {
  let respStr = `*${args.length}\r\n`;
  for (const p of args) {
    respStr += `$${Buffer.byteLength(p)}\r\n${p}\r\n`;
  }
  return Buffer.from(respStr);
}

export interface TLSOptions {
  tls?: boolean;
  insecure?: boolean;
  ca?: string;
}

function createClientSocket(
  host: string,
  port: number,
  tlsOptions: TLSOptions = {},
  onConnect: () => void
): net.Socket {
  if (tlsOptions.tls) {
    const caCert = tlsOptions.ca ? fs.readFileSync(path.resolve(process.cwd(), tlsOptions.ca)) : undefined;
    return tls.connect(
      {
        host,
        port,
        rejectUnauthorized: !tlsOptions.insecure,
        ca: caCert,
      },
      onConnect
    );
  }
  return net.createConnection({ host, port }, onConnect);
}

function runSingleCommand(
  host: string,
  port: number,
  args: string[],
  rawMode: boolean,
  password?: string,
  tlsOpts: TLSOptions = {}
): void {
  const socket = createClientSocket(host, port, tlsOpts, () => {
    if (password) {
      socket.write(buildRESPBuffer(["AUTH", password]));
    }
    socket.write(buildRESPBuffer(args));
  });

  const parser = new ClientRESPParser();
  let authHandled = !password;

  socket.on("data", (chunk) => {
    parser.append(chunk);
    while (true) {
      const res = parser.parseNext();
      if (!res) break;

      if (!authHandled) {
        authHandled = true;
        if (res.type === RESPType.Error) {
          console.error(`\x1b[31mAuthentication failed:\x1b[0m ${res.value}`);
          socket.destroy();
          process.exit(1);
        }
        continue;
      }

      process.stdout.write(formatRESPValue(res, rawMode));
      socket.end();
      break;
    }
  });

  socket.on("error", (err) => {
    console.error(`\x1b[31mError connecting to sayoDB [${host}:${port}]:\x1b[0m ${err.message}`);
    process.exit(1);
  });
}

function printBanner(host: string, port: number, isTls = false): void {
  const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    gray: "\x1b[90m",
    brightWhite: "\x1b[97m",
  };

  const logoLines = [
    "       _._",
    "  _.-``__ ''-._",
    " _.-`` `. `_. ''-._",
    ".-`` .-```. ```\\\\/ _.,_ ''-._",
    "( '      _.-' `-. `.-``` `)",
    " `-._ `-._ `.-' _.-' _.-'",
    "     `-._ `-._ `-._ `.-'",
    "         `-._ `-._ `.-'",
    "             `-._ `.-'",
    "                 `.-'",
  ];

  const infoLines = [
    `${c.bold}${c.brightWhite}sayoDB 0.1.0${c.reset} ${c.gray}(In-Memory Key-Value Store)${c.reset}`,
    `${c.gray}------------------------------------------${c.reset}`,
    `${c.cyan}Host:${c.reset}     ${c.yellow}${host}${c.reset}`,
    `${c.cyan}Port:${c.reset}     ${c.yellow}${port}${c.reset}`,
    `${c.cyan}Mode:${c.reset}     ${c.green}Standalone (RESP Protocol)${isTls ? " \x1b[36m[TLS 🔒]\x1b[0m" : ""}${c.reset}`,
    `${c.cyan}PID:${c.reset}      ${c.magenta}${process.pid}${c.reset}`,
    `${c.cyan}Status:${c.reset}   ${c.green}Connected ⚡${c.reset}`,
    ``,
    `${c.gray}Type ${c.cyan}"help"${c.gray} for commands, or ${c.yellow}"exit"${c.gray} to quit.${c.reset}`,
  ];

  console.log();
  const maxLines = Math.max(logoLines.length, infoLines.length);
  for (let i = 0; i < maxLines; i++) {
    const rawLogo = logoLines[i] || "";
    const pad = " ".repeat(Math.max(0, 32 - rawLogo.length));
    const coloredLogo = rawLogo ? `${c.cyan}${rawLogo}${c.reset}` : "";
    const right = infoLines[i] || "";
    console.log(`${coloredLogo}${pad}   ${right}`);
  }
  console.log();
}

function runRepl(
  host: string,
  port: number,
  rawMode: boolean,
  password?: string,
  tlsOpts: TLSOptions = {}
): void {
  const protocolStr = tlsOpts.tls ? "TLS" : "TCP";
  console.log(`\x1b[90mConnecting via ${protocolStr} to sayoDB server at \x1b[33m${host}:${port}\x1b[90m...\x1b[0m`);

  let authenticated = !password;

  const socket = createClientSocket(host, port, tlsOpts, () => {
    if (password) {
      socket.write(buildRESPBuffer(["AUTH", password]));
    } else {
      printBanner(host, port, !!tlsOpts.tls);
      startPrompt();
    }
  });

  const parser = new ClientRESPParser();
  let rl: readline.Interface;

  socket.on("error", (err) => {
    console.error(`\x1b[31mConnection error:\x1b[0m ${err.message}`);
    process.exit(1);
  });

  socket.on("end", () => {
    console.log("\n\x1b[33mServer closed connection.\x1b[0m");
    process.exit(0);
  });

  function startPrompt() {
    const defaultPrompt = `\x1b[1m\x1b[36msayoDB\x1b[0m \x1b[33m${host}:${port}\x1b[0m\x1b[32m>\x1b[0m `;
    const continuationPrompt = `\x1b[1m\x1b[36msayoDB\x1b[0m \x1b[33m${host}:${port}\x1b[0m\x1b[33m...\x1b[0m `;
    let multilineBuffer = "";
    const commandQueue: string[] = [];
    let isProcessingQueue = false;
    let currentResponseResolver: (() => void) | null = null;

    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: defaultPrompt,
      completer: cliCompleter,
    });

    const origGetDisplayPos = (rl as any)._getDisplayPos;
    if (typeof origGetDisplayPos === "function") {
      (rl as any)._getDisplayPos = function (str: string) {
        const cleanStr = str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
        return origGetDisplayPos.call(this, cleanStr);
      };
    }

    rl.prompt();

    socket.on("data", (chunk) => {
      parser.append(chunk);

      if (!authenticated) {
        const res = parser.parseNext();
        if (res) {
          if (res.type === RESPType.Error) {
            console.error(`\x1b[31mAuthentication failed:\x1b[0m ${res.value}`);
            socket.destroy();
            process.exit(1);
          } else {
            authenticated = true;
            printBanner(host, port, !!tlsOpts.tls);
            startPrompt();
          }
        }
        return;
      }

      while (true) {
        const res = parser.parseNext();
        if (!res) break;
        process.stdout.write(formatRESPValue(res, rawMode));
        if (currentResponseResolver) {
          const resolve = currentResponseResolver;
          currentResponseResolver = null;
          resolve();
        }
      }
    });

    const processQueue = async () => {
      if (isProcessingQueue) return;
      isProcessingQueue = true;

      while (commandQueue.length > 0) {
        const cmd = commandQueue.shift();
        if (!cmd) continue;

        const trimmed = cmd.trim();
        if (!trimmed) continue;

        const lower = trimmed.toLowerCase();
        if (lower === "exit" || lower === "quit") {
          socket.destroy();
          rl.close();
          process.exit(0);
          return;
        }

        if (lower === "clear" || lower === "cls") {
          console.clear();
          printBanner(host, port, !!tlsOpts.tls);
          continue;
        }

        if (lower === "help") {
          printHelp();
          continue;
        }

        const parts = parseCommandArgs(trimmed);
        if (parts.length > 0) {
          await new Promise<void>((resolve) => {
            currentResponseResolver = resolve;
            socket.write(buildRESPBuffer(parts));
          });
        }
      }

      isProcessingQueue = false;
      rl.prompt();
    };

    rl.on("SIGINT", () => {
      console.log("\n\x1b[33mExiting sayoDB CLI...\x1b[0m");
      socket.destroy();
      rl.close();
      process.exit(0);
    });

    let pendingPasteTimer: NodeJS.Timeout | null = null;

    rl.on("line", (line) => {
      multilineBuffer = multilineBuffer ? `${multilineBuffer}\n${line}` : line;

      if (pendingPasteTimer) {
        clearTimeout(pendingPasteTimer);
      }

      pendingPasteTimer = setTimeout(() => {
        pendingPasteTimer = null;

        const bufferToProcess = multilineBuffer;
        if (!bufferToProcess.trim()) return;

        if (hasUnclosedQuotes(bufferToProcess)) {
          rl.setPrompt(continuationPrompt);
          rl.prompt();
          return;
        }

        multilineBuffer = "";
        rl.setPrompt(defaultPrompt);

        const batchCommands = splitBatchCommands(bufferToProcess);
        for (const c of batchCommands) {
          if (c.trim()) {
            commandQueue.push(c);
          }
        }

        processQueue();
      }, 15);
    });
  }
}

export function hasUnclosedQuotes(input: string): boolean {
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === "\\" && i + 1 < input.length) {
        i++;
      }
    } else {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      }
    }
  }

  return inQuotes;
}

export function splitBatchCommands(input: string): string[] {
  const lines = input.split(/\r?\n/);
  const commands: string[] = [];
  let currentAccumulator = "";

  const commandKeywords = new Set(CLI_COMMANDS.map((c) => c.toUpperCase()));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!currentAccumulator) {
      currentAccumulator = line;
    } else {
      const firstWord = (line.split(/\s+/)[0] || "").replace(/^["']/, "").toUpperCase();
      const isNewCommand = commandKeywords.has(firstWord);

      if (isNewCommand && !hasUnclosedQuotes(currentAccumulator)) {
        commands.push(currentAccumulator.trim());
        currentAccumulator = line;
      } else {
        currentAccumulator += " " + line;
      }
    }
  }

  if (currentAccumulator.trim()) {
    const subCmds = splitBySemicolon(currentAccumulator.trim());
    for (const sc of subCmds) {
      if (sc.trim()) commands.push(sc.trim());
    }
  }

  return commands;
}

function splitBySemicolon(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      current += char;
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === "\\" && i + 1 < input.length) {
        i++;
        current += input[i];
      }
    } else {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === ";") {
        if (current.trim()) result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

export function parseCommandArgs(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === "\\" && i + 1 < input.length) {
        i++;
        current += input[i];
      } else {
        current += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else if (/\s/.test(char)) {
        if (current.length > 0) {
          args.push(current);
          current = "";
        }
      } else {
        current += char;
      }
    }
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

export const CLI_COMMANDS = [
  "STORE",
  "PUT",
  "SAVE",
  "SET",
  "FETCH",
  "READ",
  "SHOW",
  "GET",
  "REMOVE",
  "DELETE",
  "DEL",
  "CHECK",
  "HAS",
  "EXISTS",
  "LIST",
  "FIND",
  "KEYS",
  "INCREASE",
  "ADD",
  "INCR",
  "DECREASE",
  "SUBTRACT",
  "DECR",
  "TIMEOUT",
  "TTL",
  "WIPE",
  "CLEARALL",
  "FLUSHDB",
  "SEMSET",
  "SEMGET",
  "SEMSEARCH",
  "SEMFLUSH",
  "SEMDEL",
  "SCHEMA",
  "SETJSON",
  "GETJSON",
  "PING",
  "AUTH",
  "HELP",
  "CLEAR",
  "CLS",
  "EXIT",
  "QUIT",
];

const SUBCOMMAND_MAP: Record<string, string[]> = {
  SCHEMA: ["SET", "GET", "DEL", "LIST"],
  SETJSON: ["SCHEMA"],
  SEMSET: ["EMBEDDING", "EX", "NS"],
  SEMGET: ["EMBEDDING", "THRESHOLD", "NS"],
  SEMSEARCH: ["EMBEDDING", "LIMIT", "THRESHOLD", "NS"],
};

export function cliCompleter(line: string): [string[], string] {
  const trimmedLeft = line.trimStart();
  const endsWithSpace = line.endsWith(" ");
  const parts = trimmedLeft.split(/\s+/).filter(Boolean);

  if (parts.length === 0 || (parts.length === 1 && !endsWithSpace)) {
    const currentToken = parts[0] || "";
    const hits = CLI_COMMANDS.filter((cmd) =>
      cmd.toLowerCase().startsWith(currentToken.toLowerCase())
    );
    return [hits, currentToken];
  }

  const firstCmd = parts[0].toUpperCase();
  const subCommands = SUBCOMMAND_MAP[firstCmd];

  if (subCommands) {
    const currentToken = endsWithSpace ? "" : parts[parts.length - 1] || "";
    const hits = subCommands.filter((sub) =>
      sub.toLowerCase().startsWith(currentToken.toLowerCase())
    );
    return [hits, currentToken];
  }

  return [[], parts[parts.length - 1] || ""];
}

function printHelp(): void {
  const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    gray: "\x1b[90m",
    magenta: "\x1b[35m",
  };

  console.log(`
${c.bold}${c.cyan}========================================================================${c.reset}
${c.bold}${c.cyan}                      sayoDB Command Reference                          ${c.reset}
${c.bold}${c.cyan}========================================================================${c.reset}
  ${c.bold}${c.yellow}Plain-English Command${c.reset}    ${c.bold}${c.green}Standard Command${c.reset}        ${c.bold}${c.cyan}Example${c.reset}
  ---------------------    ----------------        -------
  STORE / PUT / SAVE       SET                     STORE user "Rahul"
  FETCH / READ / SHOW      GET                     FETCH user
  REMOVE / DELETE          DEL                     REMOVE user
  CHECK / HAS              EXISTS                  CHECK user
  LIST / FIND              KEYS                    LIST *
  INCREASE / ADD           INCR                    INCREASE visits
  DECREASE / SUBTRACT      DECR                    DECREASE visits
  TIMEOUT                  TTL                     TIMEOUT user
  WIPE / CLEARALL          FLUSHDB                 WIPE
  PING                     PING                    PING
  AUTH                     AUTH                    AUTH my_password

  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.magenta}AI & Semantic Vector Cache Commands${c.reset}
  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.green}SEMSET${c.reset}       SEMSET <prompt> <resp> EMBEDDING <v1 v2...> [EX sec] [NS ns]
  ${c.bold}${c.green}SEMGET${c.reset}       SEMGET [THRESHOLD 0.85] [NS ns] EMBEDDING <v1 v2...>
  ${c.bold}${c.green}SEMSEARCH${c.reset}    SEMSEARCH [LIMIT 5] [THRESHOLD 0.7] EMBEDDING <v1 v2...>
  ${c.bold}${c.green}SEMDEL${c.reset}       SEMDEL <prompt> [NS ns]
  ${c.bold}${c.green}SEMFLUSH${c.reset}     SEMFLUSH [NS ns] [TAG tag]

  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.magenta}Engine-Level JSON Schema Validation Commands${c.reset}
  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.green}SCHEMA${c.reset}       SCHEMA SET <name> <def_json> | GET <name> | DEL <name> | LIST
  ${c.bold}${c.green}SETJSON${c.reset}      SETJSON <key> [SCHEMA schema_name] <payload_json>
  ${c.bold}${c.green}GETJSON${c.reset}      GETJSON <key>

  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.magenta}Password Setup & Authentication Guide${c.reset}
  ${c.bold}${c.magenta}----------------------------------------------------------------------${c.reset}
  ${c.bold}${c.yellow}Server Password Setup:${c.reset}
    • Environment Var:  SAYODB_PASSWORD="your_password" pnpm dev
    • Command Line:     sayodb-server --requirepass "your_password"
    • Config File:      sayodb.conf -> requirepass "your_password"

  ${c.bold}${c.yellow}CLI Authentication:${c.reset}
    • Command Flag:     sayodb-cli -a "your_password"
    • Environment Var:  SAYODB_PASSWORD="your_password" sayodb-cli
    • Interactive REPL: AUTH "your_password"

  ${c.bold}${c.yellow}GUI Authentication:${c.reset}
    • Console Tab:      AUTH "your_password" in the terminal tab
${c.bold}${c.cyan}========================================================================${c.reset}
  ${c.gray}Note: Keys created without explicit TTL automatically inherit default 60s expiration.${c.reset}
`);
}
