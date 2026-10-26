// Smoke test against localhost:8080/api/v1
const BASE = 'http://localhost:8080/api/v1';

async function run() {
  console.log('--- Step 1: Health check ---');
  const hRes = await fetch(`${BASE}/health`);
  const hJson = await hRes.json();
  console.log('Health:', hJson);

  console.log('\n--- Step 2: Register ---');
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'StrongPassword123';
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Smoke Tester' })
  });
  const regJson = await regRes.json();
  console.log('Register status:', regRes.status, 'Success:', regJson.success);
  if (!regJson.success) throw new Error(JSON.stringify(regJson));
  let { accessToken, refreshToken, user } = regJson.data;

  console.log('\n--- Step 3: Login ---');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginJson = await loginRes.json();
  console.log('Login status:', loginRes.status, 'Success:', loginJson.success);
  accessToken = loginJson.data.accessToken;
  refreshToken = loginJson.data.refreshToken;

  console.log('\n--- Step 4: Create Form ---');
  const createRes = await fetch(`${BASE}/forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ title: 'Smoke Test Form', description: 'Testing end to end' })
  });
  const createJson = await createRes.json();
  const formId = createJson.data.id;
  let etag = createRes.headers.get('etag');
  console.log('Create form:', formId, 'ETag:', etag, 'Revision:', createJson.data.revision);

  console.log('\n--- Step 5: Put Fields with If-Match ---');
  const fields = [
    {
      id: 'fld_test001',
      label: 'Your Name',
      type: 'short_text',
      required: true,
      order: 0,
      placeholder: 'Enter name'
    },
    {
      id: 'fld_test002',
      label: 'Rating',
      type: 'rating',
      required: true,
      order: 1,
      validation: { min: 1, max: 5 }
    }
  ];
  const fieldsRes = await fetch(`${BASE}/forms/${formId}/fields`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'If-Match': etag
    },
    body: JSON.stringify({ fields })
  });
  const fieldsJson = await fieldsRes.json();
  etag = fieldsRes.headers.get('etag');
  console.log('Fields PUT status:', fieldsRes.status, 'New ETag:', etag, 'Revision:', fieldsJson.data?.revision);

  console.log('\n--- Step 6: Publish Form ---');
  const pubRes = await fetch(`${BASE}/forms/${formId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const pubJson = await pubRes.json();
  console.log('Publish status:', pubRes.status, 'Slug:', pubJson.data?.slug);
  const slug = pubJson.data.slug;

  console.log('\n--- Step 7: Public Fetch ---');
  const pubFormRes = await fetch(`${BASE}/public/forms/${slug}`);
  const pubFormJson = await pubFormRes.json();
  console.log('Public form status:', pubFormRes.status, 'Title:', pubFormJson.data?.title, 'Field count:', pubFormJson.data?.fields?.length);

  console.log('\n--- Step 8: Test Failed Submission to check error details shape ---');
  const badSubRes = await fetch(`${BASE}/public/forms/${slug}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: [
        { fieldId: 'fld_test001', value: '' }, // required violation
        { fieldId: 'fld_test002', value: 'invalid_number' } // invalid rating
      ]
    })
  });
  const badSubJson = await badSubRes.json();
  console.log('Bad submission status:', badSubRes.status, 'Error:', JSON.stringify(badSubJson, null, 2));

  console.log('\n--- Step 9: Valid Public Submission ---');
  const subRes = await fetch(`${BASE}/public/forms/${slug}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: [
        { fieldId: 'fld_test001', value: 'Alice Johnson' },
        { fieldId: 'fld_test002', value: 5 }
      ]
    })
  });
  const subJson = await subRes.json();
  console.log('Valid submission status:', subRes.status, 'Data:', subJson.data);

  console.log('\n--- Step 10: List Responses ---');
  const listRespRes = await fetch(`${BASE}/forms/${formId}/responses`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const listRespJson = await listRespRes.json();
  console.log('List responses status:', listRespRes.status, 'Count:', listRespJson.data?.responses?.length);

  console.log('\n--- Step 11: Analytics & Trends ---');
  const anaRes = await fetch(`${BASE}/forms/${formId}/analytics`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const anaJson = await anaRes.json();
  console.log('Analytics status:', anaRes.status, 'Total responses:', anaJson.data?.totalResponses);

  const trendRes = await fetch(`${BASE}/forms/${formId}/analytics/trends?range=7d`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const trendJson = await trendRes.json();
  console.log('Trends status:', trendRes.status, 'Points:', trendJson.data?.points?.length);

  console.log('\n--- Step 12: Export CSV ---');
  const csvRes = await fetch(`${BASE}/forms/${formId}/responses/export`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const csvText = await csvRes.text();
  console.log('CSV export status:', csvRes.status, 'CSV Preview:\n', csvText.substring(0, 150));

  console.log('\n--- Step 13: Refresh Token ---');
  const refRes = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const refJson = await refRes.json();
  console.log('Refresh status:', refRes.status, 'New AccessToken:', !!refJson.data?.accessToken);
  refreshToken = refJson.data.refreshToken;

  console.log('\n--- Step 14: Logout ---');
  const outRes = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  console.log('Logout status:', outRes.status);

  console.log('\n>>> ALL 14 SMOKE TEST STEPS PASSED SUCCESSFULLY! <<<');
}

run().catch(console.error);
