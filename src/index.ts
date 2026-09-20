#!/usr/bin/env node
import { runCli } from './cli.js';

process.exitCode = runCli(
  process.argv.slice(2),
  {
    writeOut: (message) => {
      console.log(message);
    },
    writeError: (message) => {
      console.error(message);
    },
  },
  new Date(),
);
