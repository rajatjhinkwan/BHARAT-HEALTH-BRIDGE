import http from 'http';

const test = () => {
  http.get('http://localhost:4000/api/donors?limit=200', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('HEADERS:', res.headers);
      try {
        const parsed = JSON.parse(data);
        console.log('SUCCESS! Number of donors returned:', Array.isArray(parsed) ? parsed.length : 'Not an array');
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('Sample donor returned:', parsed[0]);
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err.message);
        console.log('RAW RESPONSE (first 500 chars):', data.substring(0, 500));
      }
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Connection error (is server running?):', err.message);
    process.exit(1);
  });
};

test();
