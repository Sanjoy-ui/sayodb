import net from "node:net";
import readline from "node:readline";
import { Command } from "commander";
import { ClientRESPParser } from "./protocol/parser.js";
import { formatRESPValue } from "./formatter.js";

const program = new Command();

program
  .name("sayodb-cli")
  .description("Interactive terminal CLI client for sayoDB in-memory database")
  .option("-h, --host <host>", "sayoDB server host", process.env.SAYODB_HOST || "127.0.0.1")
  .option("-p, --port <port>", "sayoDB server port", process.env.SAYODB_PORT || "6380")
  .option("-a, --password <password>", "Authentication password")
  .option("--raw", "Print raw unformatted output", false)
  .allowUnknownOption(true)
  .argument("[command...]", "Single command to run")
  .action((commandArgs, options) => {
    const host = options.host;
    const port = parseInt(options.port, 10);
    const rawMode = options.raw;

    // Filter positional args (single command mode)
    const extraArgs = program.args;

    if (extraArgs.length > 0) {
      runSingleCommand(host, port, extraArgs, rawMode);
    } else {
      runRepl(host, port, rawMode);
    }
  });

program.parse(process.argv);

function buildRESPBuffer(args: string[]): Buffer {
  let respStr = `*${args.length}\r\n`;
  for (const p of args) {
    respStr += `$${Buffer.byteLength(p)}\r\n${p}\r\n`;
  }
  return Buffer.from(respStr);
}

function runSingleCommand(host: string, port: number, args: string[], rawMode: boolean): void {
  const socket = net.createConnection({ host, port }, () => {
    socket.write(buildRESPBuffer(args));
  });

  const parser = new ClientRESPParser();

  socket.on("data", (chunk) => {
    parser.append(chunk);
    const res = parser.parseNext();
    if (res) {
      process.stdout.write(formatRESPValue(res, rawMode));
      socket.end();
    }
  });

  socket.on("error", (err) => {
    console.error(`\x1b[31mError connecting to sayoDB [${host}:${port}]:\x1b[0m ${err.message}`);
    process.exit(1);
  });
}

function printBanner(host: string, port: number): void {
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
    `${c.cyan}Mode:${c.reset}     ${c.green}Standalone (RESP Protocol)${c.reset}`,
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

function runRepl(host: string, port: number, rawMode: boolean): void {
  console.log(`\x1b[90mConnecting to sayoDB server at \x1b[33m${host}:${port}\x1b[90m...\x1b[0m`);

  const socket = net.createConnection({ host, port }, () => {
    printBanner(host, port);
    startPrompt();
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
    const promptString = `\x1b[1m\x1b[36msayoDB\x1b[0m \x1b[33m${host}:${port}\x1b[0m\x1b[32m>\x1b[0m `;

    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: promptString,
      completer: cliCompleter,
    });

    // Strip ANSI codes when Node.js readline calculates cursor display position to prevent prompt blinking
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
      while (true) {
        const res = parser.parseNext();
        if (!res) break;
        process.stdout.write(formatRESPValue(res, rawMode));
      }
      rl.prompt();
    });

    rl.on("SIGINT", () => {
      console.log("\n\x1b[33mExiting sayoDB CLI...\x1b[0m");
      socket.destroy();
      rl.close();
      process.exit(0);
    });

    rl.on("line", (line) => {
      const input = line.trim();
      if (!input) {
        rl.prompt();
        return;
      }

      const lower = input.toLowerCase();
      if (lower === "exit" || lower === "quit") {
        socket.destroy();
        rl.close();
        process.exit(0);
        return;
      }

      if (lower === "clear" || lower === "cls") {
        console.clear();
        printBanner(host, port);
        rl.prompt();
        return;
      }

      if (lower === "help") {
        printHelp();
        rl.prompt();
        return;
      }

      const parts = parseCommandArgs(input);
      socket.write(buildRESPBuffer(parts));
    });
  }
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
  "PING",
  "HELP",
  "CLEAR",
  "CLS",
  "EXIT",
  "QUIT",
];

export function cliCompleter(line: string): [string[], string] {
  const trimmed = line.trimStart();
  const parts = trimmed.split(/\s+/);

  if (parts.length <= 1) {
    const currentToken = parts[0] || "";
    const hits = CLI_COMMANDS.filter((cmd) =>
      cmd.toLowerCase().startsWith(currentToken.toLowerCase())
    );

    return [hits.length ? hits : CLI_COMMANDS, currentToken];
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
${c.bold}${c.cyan}========================================================================${c.reset}
  ${c.gray}Note: Keys created without explicit TTL automatically inherit the default 60s expiration.${c.reset}
`);
}
