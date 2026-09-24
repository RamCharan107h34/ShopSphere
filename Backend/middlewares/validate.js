import { ZodError } from "zod";

// Turns a zod schema into Express middleware.
//
//   router.post("/x", validate({ body: mySchema }), handler)
//
// On success the *parsed* value replaces req.body, so handlers receive coerced
// and trimmed values rather than whatever the client sent.
//
// Note: req.query is intentionally not writable in Express 5 (it is a getter),
// so query validation is not supported here — validate the parsed values in the
// handler instead.
export const validate = (schemas = {}) => (req, res, next) => {
    try {
        if (schemas.body) {
            req.body = schemas.body.parse(req.body ?? {});
        }
        if (schemas.params) {
            req.params = schemas.params.parse(req.params ?? {});
        }
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            const issues = error.issues.map((issue) => ({
                field: issue.path.join(".") || "(root)",
                message: issue.message
            }));

            return res.status(400).json({
                message: "Validation failed",
                // Flat string keeps the existing single-message UI working...
                error: issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "),
                // ...while field-level detail lets forms highlight inputs later.
                issues
            });
        }
        return next(error);
    }
};
