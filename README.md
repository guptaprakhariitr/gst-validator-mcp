# gst-validator-mcp

> MCP server that validates Indian **GSTIN** (Goods & Services Tax Identification Numbers) — structural checks, embedded PAN extraction, state-code lookup, and the official GSTN mod-36 check character. Pure local compute, no upstream API, microsecond latencies.

For AI agents that touch Indian invoices, vendor onboarding, KYC, B2B billing, or anything else that mentions a GSTIN.

**Endpoint:** `https://gst-validator-mcp.prakhar-cognizance.workers.dev/mcp`

---

## Tools

| Tool | Purpose |
|------|---------|
| `validate_gstin(gstin)` | Full validation: length, character set, state code, embedded PAN, check character. |
| `extract_pan(gstin)`    | Pull the 10-char PAN out of a GSTIN. |
| `state_from_gstin(gstin)` | Resolve the 2-char state code prefix to the state/UT name. |

Example:

```bash
curl -sS -X POST https://gst-validator-mcp.prakhar-cognizance.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-key>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"validate_gstin","arguments":{"gstin":"27AAPFU0939F1ZV"}}}'
```

Returns:

```json
{
  "valid": true,
  "state": "Maharashtra",
  "state_code": "27",
  "pan": "AAPFU0939F",
  "entity_code": "1",
  "check_char": "V"
}
```

---

## Install in Cursor / Claude Desktop / Cline

Add to your MCP config (e.g. `~/.cursor/mcp.json`, `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gst-validator": {
      "url": "https://gst-validator-mcp.prakhar-cognizance.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <your-key>" }
    }
  }
}
```

Without a key, you get the **free tier (100 calls/month, 10/min)** keyed off your client IP.

---

## Pricing

| Tier  | Price        | Calls/month | Rate     |
|-------|--------------|-------------|----------|
| Free  | $0           | 100         | 10/min   |
| Solo  | $9 / mo      | 2,000       | 60/min   |
| Team  | $29 / mo     | 10,000      | 200/min  |
| Pro   | $79 / mo     | 50,000      | 600/min  |

Subscribe at <https://gst-validator-mcp.prakhar-cognizance.workers.dev/upgrade?tier=solo>. Powered by [Dodo Payments](https://dodopayments.com) as merchant of record — Dodo handles GST/VAT remittance worldwide.

---

## GSTIN format reference

A GSTIN is 15 characters drawn from `[0-9A-Z]`:

| Position | Length | Meaning |
|---------:|-------:|---------|
| 1-2      | 2      | State (TIN) code — e.g. `27` = Maharashtra |
| 3-12     | 10     | Embedded PAN (5 letters + 4 digits + 1 letter) |
| 13       | 1      | Entity registration count for that PAN in that state (1-9, A-Z) |
| 14       | 1      | Default `Z` (special bodies may use other letters) |
| 15       | 1      | Check character (mod-36 factor checksum over the first 14) |

The check-character algorithm is the one documented by GSTN: multiply each base-36 code-point by an alternating factor of 2,1,2,1,... walking right-to-left, fold each product as `(p/36) + (p%36)`, sum, and the check code-point is `(36 - sum%36) % 36`.

---

## Self-service

- `GET /account` (with `Authorization: Bearer <key>`) — current tier, usage, portal link.
- `POST /account/rotate` — revoke the current key and mint a new one on the same subscription.
- Customer portal — manage / cancel / update payment method via Dodo.

Lost your key? Email <prakshatechnologies@gmail.com> with your Dodo subscription ID.

---

## License

MIT © 2026 Prakhar Gupta · <prakshatechnologies@gmail.com>
