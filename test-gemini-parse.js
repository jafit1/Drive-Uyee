function extractTokens(html) {
  const snMatch = html.match(/SNlM0e["\\:\s]+([A-Za-z0-9_\-:]+)/) || html.match(/"SNlM0e":"([^"]+)"/);
  const blMatch = html.match(/cfb2h["\\:\s]+([A-Za-z0-9_\-\.]+)/) || html.match(/"cfb2h":"([^"]+)"/);
  return {
    snlm0e: snMatch ? snMatch[1] : null,
    bl: blMatch ? blMatch[1] : 'boq_assistant-bard-web-server_20260301.00_p0'
  };
}

const sample = `,"SNlM0e":"AIzaSyD-sample_token_value_abc","cfb2h":"boq_assistant-bard-web-server_20260210.01_p0"`;
console.log('Result:', extractTokens(sample));
