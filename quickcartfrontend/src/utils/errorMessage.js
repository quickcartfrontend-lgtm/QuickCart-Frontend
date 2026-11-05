// Mandate 2: the ONLY place that interprets API errors.
export function parseApiError(error) {
  if (!error?.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the server. Please retry.',
      fieldErrors: {},
    };
  }

  const data = error.response.data || {};
  const fieldErrors = {};
  if (Array.isArray(data.details)) {
    data.details.forEach((d) => {
      if (d?.field && !(d.field in fieldErrors)) fieldErrors[d.field] = d.message;
    });
  }

  return {
    code: data.code || 'UNKNOWN_ERROR',
    message: data.message || 'Something went wrong. Please try again.',
    fieldErrors,
  };
}