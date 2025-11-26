// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        // In development, you might want to see the stack trace
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };