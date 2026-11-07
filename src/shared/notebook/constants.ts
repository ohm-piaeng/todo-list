// Plain values shared by main and renderer. Kept free of zod so importing them
// does not pull the validation library into the renderer bundle.

/** Font sizes offered by the to-do toolbar (px). */
export const TEXT_SIZES = [13, 14, 16, 18, 20, 24] as const
