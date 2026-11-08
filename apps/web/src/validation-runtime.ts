import { config } from "zod";
// Keep the existing strict CSP. Firefox reports even a caught JIT-eval attempt.
// All browser schemas use Zod's interpreter rather than dynamic code generation.
config({ jitless: true });
