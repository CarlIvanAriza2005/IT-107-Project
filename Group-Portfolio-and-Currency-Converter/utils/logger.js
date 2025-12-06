const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isCloudDeployment = process.env.CLOUD_DEPLOYMENT === 'true' || 
                         process.env.VERCEL === 'true' || 
                         process.env.RAILWAY_ENVIRONMENT || 
                         process.env.HEROKU_APP_NAME ||
                         process.env.RENDER;

// Determine if we should use file logging
// Use file logging if: not cloud deployment AND file logging is not explicitly disabled
const useFileLogging = !isCloudDeployment && process.env.USE_FILE_LOGGING !== 'false';

// Log format for all transports
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format (more readable for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Setup file logging if enabled
let accessFileTransport = null;
let errorFileTransport = null;
let securityFileTransport = null;

if (useFileLogging) {
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create file transports with Winston's built-in File transport
    // Winston automatically rotates files when they reach maxsize
    const accessLogPath = path.join(logsDir, 'access.log');
    const errorLogPath = path.join(logsDir, 'error.log');
    const securityLogPath = path.join(logsDir, 'security.log');

    accessFileTransport = new winston.transports.File({
        filename: accessLogPath,
        format: logFormat,
        level: 'info',
        maxsize: 20 * 1024 * 1024, // 20MB - Winston will auto-rotate
        maxFiles: 5 // Keep 5 rotated files (access.log.1, access.log.2, etc.)
    });

    errorFileTransport = new winston.transports.File({
        filename: errorLogPath,
        format: logFormat,
        level: 'error',
        maxsize: 20 * 1024 * 1024,
        maxFiles: 5
    });

    securityFileTransport = new winston.transports.File({
        filename: securityLogPath,
        format: logFormat,
        level: 'warn', // Only warnings and errors
        maxsize: 20 * 1024 * 1024,
        maxFiles: 5
    });
}

// Console transport (always available)
const consoleTransport = new winston.transports.Console({
    format: isProduction ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
});

// Build transports array based on environment
const transports = [];

if (useFileLogging) {
    // Local/server deployment: use file logging
    transports.push(accessFileTransport, errorFileTransport, securityFileTransport);
    
    // Also log to console in development
    if (!isProduction) {
        transports.push(consoleTransport);
    }
} else {
    // Cloud deployment: use console only (platform will capture stdout/stderr)
    transports.push(consoleTransport);
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: transports,
    // Handle exceptions and rejections
    exceptionHandlers: useFileLogging ? [
        new winston.transports.File({
            filename: path.join(__dirname, '..', 'logs', 'exceptions.log'),
            format: logFormat,
            maxsize: 20 * 1024 * 1024,
            maxFiles: 5
        }),
        consoleTransport
    ] : [consoleTransport],
    rejectionHandlers: useFileLogging ? [
        new winston.transports.File({
            filename: path.join(__dirname, '..', 'logs', 'rejections.log'),
            format: logFormat,
            maxsize: 20 * 1024 * 1024,
            maxFiles: 5
        }),
        consoleTransport
    ] : [consoleTransport]
});

// Log environment info on startup
logger.info('Logger initialized', {
    environment: process.env.NODE_ENV || 'development',
    useFileLogging,
    isCloudDeployment,
    logLevel: process.env.LOG_LEVEL || 'info'
});

// Helper function to extract client IP
function getClientIP(req) {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
}

// Helper function to sanitize sensitive data from request
function sanitizeRequest(req) {
    const sanitized = {
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length'],
            'referer': req.headers['referer'],
            'origin': req.headers['origin']
        },
        // Don't log sensitive headers
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    return sanitized;
}

// Request logging middleware
function logRequest(req, res, next) {
    const startTime = Date.now();
    const requestData = sanitizeRequest(req);

    // Log the incoming request
    logger.info('Incoming request', requestData);

    // Capture response details
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseData = {
            ...requestData,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: res.get('content-length') || 'unknown'
        };

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error('Request error', responseData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request failed', responseData);
        } else {
            logger.info('Request completed', responseData);
        }
    });

    next();
}

// Security event logging
function logSecurityEvent(eventType, details, req = null) {
    const securityLog = {
        eventType,
        timestamp: new Date().toISOString(),
        ...details
    };

    if (req) {
        securityLog.ip = getClientIP(req);
        securityLog.userAgent = req.headers['user-agent'];
        securityLog.path = req.originalUrl || req.url;
        securityLog.method = req.method;
    }

    logger.warn('Security event', securityLog);
}

// Error logging with context
function logError(error, context = {}) {
    logger.error('Application error', {
        message: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    logger,
    logRequest,
    logSecurityEvent,
    logError,
    getClientIP
};
