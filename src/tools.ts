import { Tool } from "./mcp-server";
import { validateGstin, extractPan, stateFromGstin } from "./upstream";

export function buildTools(): Tool[] {
  return [
    {
      name: "validate_gstin",
      description:
        "Validate an Indian GSTIN (15-char Goods & Services Tax Identification Number). Checks length, character set, state code, embedded PAN format, and the GSTN mod-36 check character. Returns {valid, state, state_code, pan, entity_code, check_char, error?}.",
      inputSchema: {
        type: "object",
        properties: {
          gstin: { type: "string", description: "15-char GSTIN, e.g. '27AAPFU0939F1ZV'. Case-insensitive; surrounding whitespace is trimmed." },
        },
        required: ["gstin"],
      },
      handler: async (args) => validateGstin(String(args.gstin)),
    },

    {
      name: "extract_pan",
      description:
        "Extract the 10-character PAN embedded in a GSTIN (positions 3-12, 1-indexed). Throws if the GSTIN is the wrong length or the embedded PAN is malformed. Does NOT verify the check character — use validate_gstin for that.",
      inputSchema: {
        type: "object",
        properties: {
          gstin: { type: "string", description: "15-char GSTIN." },
        },
        required: ["gstin"],
      },
      handler: async (args) => extractPan(String(args.gstin)),
    },

    {
      name: "state_from_gstin",
      description:
        "Resolve the Indian state/UT name from a GSTIN's first 2 characters (the TIN state code). Accepts a full GSTIN or just the 2-char prefix. Returns {state_code, state_name}, e.g. ('27', 'Maharashtra').",
      inputSchema: {
        type: "object",
        properties: {
          gstin: { type: "string", description: "Full GSTIN or 2-char state-code prefix." },
        },
        required: ["gstin"],
      },
      handler: async (args) => stateFromGstin(String(args.gstin)),
    },
  ];
}
