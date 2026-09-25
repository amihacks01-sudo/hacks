const API_BASE_URL = 'http://127.0.0.1:8000';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'online';
  } catch (e) {
    return false;
  }
}

export async function runScan(file = null, specJsonStr = '', targetUrl = 'http://127.0.0.1:9000', authConfig = null, geminiKey = '') {
  const formData = new FormData();
  formData.append('target_url', targetUrl);

  if (file) {
    formData.append('file', file);
  } else if (specJsonStr && specJsonStr.trim()) {
    formData.append('spec_json_str', specJsonStr);
  }

  if (authConfig) {
    formData.append('auth_config_json', JSON.stringify(authConfig));
  }
  // Append Gemini API key if provided
  if (geminiKey && geminiKey.trim()) {
    formData.append('gemini_api_key', geminiKey.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Scan pipeline failed to execute');
  }

  return await response.json();
}

export async function fetchFindings() {
  const response = await fetch(`${API_BASE_URL}/api/findings`);
  if (!response.ok) {
    throw new Error('Failed to fetch scan findings');
  }
  return await response.json();
}

export async function fetchScanResult(scanId = 'latest') {
  const response = await fetch(`${API_BASE_URL}/api/scan/${scanId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scan results');
  }
  return await response.json();
}

export async function replayAttack(findingId) {
  const response = await fetch(`${API_BASE_URL}/api/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finding_id: findingId }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Attack replay failed');
  }

  return await response.json();
}
