import { z } from "zod";
export function transportSchema(value: z.ZodType) {
  return z.toJSONSchema(value, {
    target: "draft-7",
    override: ({ zodSchema, jsonSchema }) => {
      // z.json() uses a recursive lazy union. AJV's coercing anyOf walk mutates
      // scientific numbers, arrays and nulls. Keep that subtree opaque in transport;
      // strict JSON parsing and the handler's Zod contract still validate its value.
      if (zodSchema instanceof z.ZodLazy)
        for (const key of Object.keys(jsonSchema))
          delete (jsonSchema as Record<string, unknown>)[key];
    },
  });
}
