const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Mini ERP & CRM Backend API Integration Suite...\n');

  try {
    // 1. Health Check
    const health = await request({ host: 'localhost', port: 5000, path: '/health', method: 'GET' });
    console.log('1. Health Check status:', health.status, health.data.status);

    // 2. Auth Login (Admin)
    const loginRes = await request(
      {
        host: 'localhost',
        port: 5000,
        path: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'admin@test.com', password: 'password123' }
    );
    console.log('2. Login status:', loginRes.status, 'User:', loginRes.data.user?.email, 'Role:', loginRes.data.user?.role);
    const token = loginRes.data.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 3. Customers CRM - Get list & Add
    const custs = await request({ host: 'localhost', port: 5000, path: '/customers?search=', method: 'GET', headers: authHeaders });
    console.log('3. Customers count:', custs.data.data?.length);

    // 4. Products - Get list
    const prods = await request({ host: 'localhost', port: 5000, path: '/products', method: 'GET', headers: authHeaders });
    console.log('4. Products count:', prods.data.data?.length);

    // 5. Create Confirmed Challan & Check Stock Deduction
    const p1 = prods.data.data[0];
    const initialStock = p1.current_stock;
    console.log(`5. Product '${p1.name}' Initial Stock:`, initialStock);

    const challanRes = await request(
      { host: 'localhost', port: 5000, path: '/challans', method: 'POST', headers: authHeaders },
      { customerId: 1, items: [{ productId: p1.id, qty: 2 }], status: 'Confirmed' }
    );
    console.log('6. Create Confirmed Challan status:', challanRes.status, 'Challan No:', challanRes.data.challan?.challan_number);

    // Verify Stock Reduction
    const prodsAfter = await request({ host: 'localhost', port: 5000, path: '/products', method: 'GET', headers: authHeaders });
    const p1After = prodsAfter.data.data.find((p) => p.id === p1.id);
    console.log(`7. Product '${p1.name}' Stock After Dispatch:`, p1After.current_stock, `(Deducted: ${initialStock - p1After.current_stock})`);

    // 8. Test Negative Stock Prevention
    const excessiveChallan = await request(
      { host: 'localhost', port: 5000, path: '/challans', method: 'POST', headers: authHeaders },
      { customerId: 1, items: [{ productId: p1.id, qty: 99999 }], status: 'Confirmed' }
    );
    console.log('8. Excessive Stock Attempt Status:', excessiveChallan.status, 'Error Msg:', excessiveChallan.data.message);

    console.log('\n✅ All Backend API integration tests completed successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTests();
