export const LOG_LEVELS = {
  VERBOSE: "verbose",
  CRITICAL: "critical",
};

const currentLogLevel = process.env.LOG_LEVEL || LOG_LEVELS.VERBOSE;

export const verbose = (...args) => {
  if (currentLogLevel === LOG_LEVELS.VERBOSE) {
    console.log("[VERBOSE]", new Date().toISOString(), ...args);
  }
};

export const critical = (...arge) => {
  console.error("[CRITICAL]", new Date().toISOString(), ...arge);
};

const logger = {
  verbose,
  critical,
  LOG_LEVELS,
};

export default logger;
