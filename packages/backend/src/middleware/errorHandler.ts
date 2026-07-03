/** Error handler middleware */
export function errorHandler(error: any, _request: any, reply: any) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  if (statusCode >= 500) {
    console.error('[ERROR]', error);
  }
  
  reply.status(statusCode).send({
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}
