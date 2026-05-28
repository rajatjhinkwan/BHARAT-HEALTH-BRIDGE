import http from 'http';

const test = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:4000/api${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 300) + (data.length > 300 ? '...' : '')
        });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
};

const run = async () => {
  console.log('Testing ICU API...');
  const icuRes = await test('/critical/icu/patients');
  console.log('ICU RESPONSE:', JSON.stringify(icuRes, null, 2));

  console.log('\nTesting Ventilator API...');
  const ventRes = await test('/critical/ventilator/patients');
  console.log('VENTILATOR RESPONSE:', JSON.stringify(ventRes, null, 2));
  process.exit(0);
};

run();
