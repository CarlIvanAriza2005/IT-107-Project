// Lightweight structured logger used internally. Avoids extra dependencies.
// Exports CommonJS module compatible with `require()` and also provides
// `default` for ESM interop when imported.
function safeStringify(obj) {
    try {
        return JSON.stringify(obj);
    } catch (e) {
        return String(obj);
    }
}

function log(level, event, meta) {
    const payload = {
        level,
        event: event || null,
        time: new Date().toISOString(),
        meta: meta || null
    };
    // One-line JSON for easy ingestion by log collectors
    console.log(safeStringify(payload));
}

module.exports = {
    info: (event, meta) => log('info', event, meta),
    warn: (event, meta) => log('warn', event, meta),
    error: (event, meta) => log('error', event, meta)
};

// ESM default compatibility
module.exports.default = module.exports;
