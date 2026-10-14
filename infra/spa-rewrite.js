// CloudFront Function (viewer request) attached only to the S3 (default) behavior.
// Client-side routes such as /tasks or /reports have no file in S3, so they are
// rewritten to /index.html and React Router renders them. /api/* never reaches this
// function because it has its own cache behavior pointing to Elastic Beanstalk.
function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
