// Pure local Indian GSTIN validator. No upstream API required — GSTIN structure
// and check character are publicly documented by GSTN (CBIC).
//
// GSTIN layout (15 chars, drawn from [0-9A-Z]):
//   positions 0-1   state code     (numeric, "01"-"38" or "97"/"99")
//   positions 2-11  PAN            (10 chars; 5 letters + 4 digits + 1 letter)
//   position  12    entity number  (1-9 or A-Z, registration count within state)
//   position  13    'Z'            (default placeholder; some special bodies use other letters)
//   position  14    check char     (mod-36 factor checksum over the first 14)
//
// References:
//   - GSTN format spec (PDF circulated by CBIC).
//   - Canonical reference impl: https://github.com/seoseo/gstin-verifier
//   - State codes: https://gst.gov.in (master list).

// ── State (TIN) codes ────────────────────────────────────────────────────────
export const STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

// ── Check-character algorithm (mod-36 alternating factor) ────────────────────
// Documented by GSTN and used by every open-source GSTIN validator.
//
// 1. Map each char to its base-36 code-point (0-35).
// 2. Walk the first 14 chars right-to-left, multiplying by factor 2,1,2,1,...
// 3. Each product gets folded as (product/36 floor) + (product mod 36) and added.
// 4. Check code-point = (36 - sum%36) % 36; check char = ALPHABET[cp].

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function computeCheckChar(first14: string): string {
  if (first14.length !== 14) throw new Error("computeCheckChar expects 14 chars");
  let sum = 0;
  let factor = 2;
  for (let i = first14.length - 1; i >= 0; i--) {
    const cp = ALPHABET.indexOf(first14[i]);
    if (cp < 0) throw new Error(`Invalid GSTIN char: ${first14[i]}`);
    let product = factor * cp;
    factor = factor === 2 ? 1 : 2;
    product = Math.floor(product / 36) + (product % 36);
    sum += product;
  }
  const cp = (36 - (sum % 36)) % 36;
  return ALPHABET[cp];
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface GstinValidation {
  valid: boolean;
  state?: string;          // human-readable state name
  state_code?: string;
  pan?: string;
  entity_code?: string;
  check_char?: string;
  error?: string;
}

/** Structural + check-character validation of a GSTIN. */
export function validateGstin(input: string): GstinValidation {
  if (typeof input !== "string") return { valid: false, error: "GSTIN must be a string" };
  const gstin = input.trim().toUpperCase();
  if (gstin.length !== 15) {
    return { valid: false, error: `GSTIN must be exactly 15 characters (got ${gstin.length})` };
  }
  if (!/^[0-9A-Z]{15}$/.test(gstin)) {
    return { valid: false, error: "GSTIN must contain only digits and uppercase letters" };
  }

  const stateCode = gstin.slice(0, 2);
  const pan = gstin.slice(2, 12);
  const entityCode = gstin.slice(12, 13);
  const zChar = gstin.slice(13, 14);
  const checkChar = gstin.slice(14, 15);

  if (!STATE_CODES[stateCode]) {
    return { valid: false, error: `Unknown state code: ${stateCode}`, state_code: stateCode };
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { valid: false, error: `Embedded PAN '${pan}' has invalid format (expected AAAAA9999A)`, state_code: stateCode, pan };
  }
  if (!/^[1-9A-Z]$/.test(entityCode)) {
    return { valid: false, error: `Invalid entity code '${entityCode}' (must be 1-9 or A-Z)` };
  }
  if (!/^[A-Z]$/.test(zChar)) {
    return { valid: false, error: `Position 14 must be a letter (got '${zChar}')` };
  }

  let expected: string;
  try {
    expected = computeCheckChar(gstin.slice(0, 14));
  } catch (e) {
    return { valid: false, error: `Checksum calculation failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (expected !== checkChar) {
    return {
      valid: false,
      error: `Checksum mismatch (expected '${expected}', got '${checkChar}')`,
      state_code: stateCode,
      state: STATE_CODES[stateCode],
      pan,
      entity_code: entityCode,
      check_char: checkChar,
    };
  }
  return {
    valid: true,
    state_code: stateCode,
    state: STATE_CODES[stateCode],
    pan,
    entity_code: entityCode,
    check_char: checkChar,
  };
}

/** Extract just the PAN (10 chars) embedded in a GSTIN. */
export function extractPan(input: string): { pan: string } {
  const gstin = (input ?? "").trim().toUpperCase();
  if (gstin.length !== 15) throw new Error(`GSTIN must be 15 chars (got ${gstin.length})`);
  const pan = gstin.slice(2, 12);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new Error(`Embedded PAN '${pan}' is malformed`);
  }
  return { pan };
}

/** Resolve the state name from a GSTIN's first 2 characters. */
export function stateFromGstin(input: string): { state_code: string; state_name: string } {
  const gstin = (input ?? "").trim().toUpperCase();
  if (gstin.length < 2) throw new Error("Input must contain at least 2 characters for state lookup");
  const stateCode = gstin.slice(0, 2);
  const stateName = STATE_CODES[stateCode];
  if (!stateName) throw new Error(`Unknown state code '${stateCode}'`);
  return { state_code: stateCode, state_name: stateName };
}
