const fs = require('fs');

async function testUpload() {
  const baseURL = 'https://xerox-backend-plld.onrender.com/api';
  
  try {
    console.log('1. Logging in as student...');
    const loginRes = await fetch(`${baseURL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roll_number: '12345', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed', loginRes.status, await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Token received!');

    console.log('2. Creating dummy PDF...');
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n198\n%%EOF');
    
    console.log('3. Uploading document...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="dummy.pdf"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    
    // Convert string to buffer and concat
    const bodyHeader = Buffer.from(body);
    const bodyFooter = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="color_mode"\r\n\r\nbw\r\n--${boundary}\r\nContent-Disposition: form-data; name="paper_size"\r\n\r\nA4\r\n--${boundary}\r\nContent-Disposition: form-data; name="copies"\r\n\r\n1\r\n--${boundary}--\r\n`);
    
    const finalBody = Buffer.concat([bodyHeader, pdfBuffer, bodyFooter]);

    const uploadRes = await fetch(`${baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: finalBody
    });

    if (uploadRes.ok) {
      console.log('Upload successful!', await uploadRes.json());
    } else {
      console.error('Upload failed with status', uploadRes.status);
      console.error(await uploadRes.text());
    }
  } catch (error) {
    console.error('Test failed!', error);
  }
}

testUpload();
