import { HttpStatusCategory, HttpStatusExplanation } from '../types';

interface StatusDefinition {
  phrase: string;
  category: HttpStatusCategory;
  fact: string;
  observation: string;
  interpretation: string;
}

const STATUS_DICTIONARY: Record<number, StatusDefinition> = {
  // 1xx Informational
  100: {
    phrase: 'Continue',
    category: 'informational',
    fact: 'Server returned HTTP status 100 Continue.',
    observation: 'The server received the initial request headers and signaled the client to continue sending the payload.',
    interpretation: 'Protocol negotiation indicates the server is ready to accept the remainder of the request body.',
  },
  101: {
    phrase: 'Switching Protocols',
    category: 'informational',
    fact: 'Server returned HTTP status 101 Switching Protocols.',
    observation: 'The server accepted an Upgrade request header to transition to an alternative transport protocol.',
    interpretation: 'Typically used when upgrading to WebSocket or HTTP/2 protocol layers.',
  },

  // 2xx Success
  200: {
    phrase: 'OK',
    category: 'success',
    fact: 'Server returned HTTP status 200 OK.',
    observation: 'The request succeeded and the server returned the requested resource payload.',
    interpretation: 'The target endpoint is actively serving content and processing HTTP requests normally.',
  },
  201: {
    phrase: 'Created',
    category: 'success',
    fact: 'Server returned HTTP status 201 Created.',
    observation: 'The request has been fulfilled and resulted in one or more new resources being created.',
    interpretation: 'The endpoint completed a resource creation action as requested.',
  },
  204: {
    phrase: 'No Content',
    category: 'success',
    fact: 'Server returned HTTP status 204 No Content.',
    observation: 'The server successfully fulfilled the request and returned headers without a message body.',
    interpretation: 'The action completed without requiring document transmission back to the client.',
  },
  206: {
    phrase: 'Partial Content',
    category: 'success',
    fact: 'Server returned HTTP status 206 Partial Content.',
    observation: 'The server fulfilled a partial GET request specified by a Range header.',
    interpretation: 'The target supports byte-range serving, common in streaming media or resumed downloads.',
  },

  // 3xx Redirection
  301: {
    phrase: 'Moved Permanently',
    category: 'redirection',
    fact: 'Server returned HTTP status 301 Moved Permanently with a Location header.',
    observation: 'The requested resource has been assigned a new permanent URI.',
    interpretation: 'The target operates an automatic permanent redirect rule, frequently to canonicalize www/non-www or upgrade http to https.',
  },
  302: {
    phrase: 'Found',
    category: 'redirection',
    fact: 'Server returned HTTP status 302 Found with a Location header.',
    observation: 'The target resource resides temporarily under a different URI.',
    interpretation: 'The server redirected the client temporarily; future requests should continue to use the original URI unless configured otherwise.',
  },
  303: {
    phrase: 'See Other',
    category: 'redirection',
    fact: 'Server returned HTTP status 303 See Other with a Location header.',
    observation: 'The response directs the client to get the resource at another URI with a GET request.',
    interpretation: 'Commonly used in web applications after a POST submission to prevent form resubmission.',
  },
  304: {
    phrase: 'Not Modified',
    category: 'redirection',
    fact: 'Server returned HTTP status 304 Not Modified.',
    observation: 'The server verified that the cached version held by the client matches the current resource.',
    interpretation: 'Conditional headers (ETag, If-Modified-Since) matched; no response payload was transferred.',
  },
  307: {
    phrase: 'Temporary Redirect',
    category: 'redirection',
    fact: 'Server returned HTTP status 307 Temporary Redirect with a Location header.',
    observation: 'The target resource temporarily resides under a different URI with guaranteed request method preservation.',
    interpretation: 'The client must repeat the exact request method and body at the target URI.',
  },
  308: {
    phrase: 'Permanent Redirect',
    category: 'redirection',
    fact: 'Server returned HTTP status 308 Permanent Redirect with a Location header.',
    observation: 'The target resource has permanently moved to a new URI with request method preservation.',
    interpretation: 'Permanent redirect where the client must preserve the HTTP method (e.g. POST remains POST).',
  },

  // 4xx Client Error
  400: {
    phrase: 'Bad Request',
    category: 'client_error',
    fact: 'Server returned HTTP status 400 Bad Request.',
    observation: 'The server cannot or will not process the request due to perceived client-side malformation.',
    interpretation: 'The request syntax, framing, or routing parameters were rejected by the remote server parser.',
  },
  401: {
    phrase: 'Unauthorized',
    category: 'client_error',
    fact: 'Server returned HTTP status 401 Unauthorized.',
    observation: 'The request requires user authentication credentials (WWW-Authenticate header may be present).',
    interpretation: 'The resource is restricted to authenticated sessions and no valid authentication token was provided.',
  },
  403: {
    phrase: 'Forbidden',
    category: 'client_error',
    fact: 'Server returned HTTP status 403 Forbidden.',
    observation: 'The server understood the request but refuses to authorize it.',
    interpretation: 'Access to this resource is prohibited by server policy, access control lists, or endpoint restrictions. Authentication will not necessarily grant access.',
  },
  404: {
    phrase: 'Not Found',
    category: 'client_error',
    fact: 'Server returned HTTP status 404 Not Found.',
    observation: 'The origin server did not find a current representation for the target resource.',
    interpretation: 'No document exists at the specified URI path, or the server is deliberately hiding the existence of the resource.',
  },
  405: {
    phrase: 'Method Not Allowed',
    category: 'client_error',
    fact: 'Server returned HTTP status 405 Method Not Allowed.',
    observation: 'The method received in the request-line is known to the origin server but not supported by the target resource.',
    interpretation: 'The endpoint does not permit the requested HTTP method (e.g. GET instead of POST).',
  },
  408: {
    phrase: 'Request Timeout',
    category: 'client_error',
    fact: 'Server returned HTTP status 408 Request Timeout.',
    observation: 'The server did not receive a complete request message within the time it was prepared to wait.',
    interpretation: 'The client connection took longer than the server timeout threshold allowed.',
  },
  410: {
    phrase: 'Gone',
    category: 'client_error',
    fact: 'Server returned HTTP status 410 Gone.',
    observation: 'Access to the target resource is no longer available at the origin server and this condition is likely permanent.',
    interpretation: 'The resource has been deliberately purged with no forwarding address.',
  },
  429: {
    phrase: 'Too Many Requests',
    category: 'client_error',
    fact: 'Server returned HTTP status 429 Too Many Requests.',
    observation: 'The user or source IP has sent too many requests in a given amount of time.',
    interpretation: 'Rate limiting controls are enforced on the target server. A Retry-After header may specify the backoff window.',
  },

  // 5xx Server Error
  500: {
    phrase: 'Internal Server Error',
    category: 'server_error',
    fact: 'Server returned HTTP status 500 Internal Server Error.',
    observation: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
    interpretation: 'An application runtime failure, unhandled exception, or misconfiguration occurred on the origin server.',
  },
  502: {
    phrase: 'Bad Gateway',
    category: 'server_error',
    fact: 'Server returned HTTP status 502 Bad Gateway.',
    observation: 'The server, while acting as a gateway or proxy, received an invalid response from an inbound server.',
    interpretation: 'An upstream backend server failed to communicate properly with the edge reverse proxy or load balancer.',
  },
  503: {
    phrase: 'Service Unavailable',
    category: 'server_error',
    fact: 'Server returned HTTP status 503 Service Unavailable.',
    observation: 'The server is currently unable to handle the request due to temporary overload or maintenance.',
    interpretation: 'The service is temporarily down or congested; the condition is generally temporary and may resolve on retry.',
  },
  504: {
    phrase: 'Gateway Timeout',
    category: 'server_error',
    fact: 'Server returned HTTP status 504 Gateway Timeout.',
    observation: 'The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server.',
    interpretation: 'The reverse proxy or CDN edge timed out waiting for the origin application server to respond.',
  },
};

export function getHttpStatusExplanation(statusCode: number): HttpStatusExplanation {
  if (STATUS_DICTIONARY[statusCode]) {
    const def = STATUS_DICTIONARY[statusCode];
    return {
      code: statusCode,
      phrase: def.phrase,
      category: def.category,
      fact: def.fact,
      observation: def.observation,
      interpretation: def.interpretation,
    };
  }

  // Fallback for uncommon or custom status codes
  let category: HttpStatusCategory = 'unknown';
  let genericPhrase = 'Unknown Status';

  if (statusCode >= 100 && statusCode < 200) {
    category = 'informational';
    genericPhrase = 'Informational';
  } else if (statusCode >= 200 && statusCode < 300) {
    category = 'success';
    genericPhrase = 'Success';
  } else if (statusCode >= 300 && statusCode < 400) {
    category = 'redirection';
    genericPhrase = 'Redirection';
  } else if (statusCode >= 400 && statusCode < 500) {
    category = 'client_error';
    genericPhrase = 'Client Error';
  } else if (statusCode >= 500 && statusCode < 600) {
    category = 'server_error';
    genericPhrase = 'Server Error';
  }

  return {
    code: statusCode,
    phrase: genericPhrase,
    category,
    fact: `Server returned HTTP status code ${statusCode}.`,
    observation: `The response code indicates a ${category.replace('_', ' ')} condition according to RFC HTTP specifications.`,
    interpretation: `Standard HTTP specification categorizes status ${statusCode} under class ${Math.floor(statusCode / 100)}xx. Specific application context determines behavior.`,
  };
}
