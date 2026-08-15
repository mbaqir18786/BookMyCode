const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/index');
const seed = require('../src/db/seed');
const { db } = require('../src/db');

describe('IVR End-to-end flows', function() {
  this.timeout(5000);

  before(async () => {
    // Recreate DB and seed known data
    await seed();
  });

  it('should return main menu XML when call begins (no digits)', async () => {
    const res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_1', From: '+919876543210', To: '+919417000000' });

    expect(res.status).to.equal(200);
    expect(res.type).to.match(/xml/);
    expect(res.text).to.include('<Gather');
    expect(res.text).to.include('For machinery');
  });

  it('should handle machinery flow and create a booking when confirmed', async () => {
    // Start call first to create call_logs
    await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_2', From: '+919876543210', To: '+919417000000' });

    // Press 1 to choose machinery
    let res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_2', From: '+919876543210', Digits: '1' });

    expect(res.status).to.equal(200);
    console.log('\nMACHINERY MENU RESPONSE:\n', res.text);
    expect(res.text).to.include('Recommended');

    // Confirm booking (press 1 again)
    res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_2', From: '+919876543210', Digits: '1' });

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Your booking has been created');

    // Verify booking exists in DB
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM bookings WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1", ['usr_farmer_1'], (err, r) => {
        if (err) return reject(err);
        resolve(r);
      });
    });

    expect(row).to.exist;
    expect(row.machine_id).to.match(/mach_/);
  });

  it('should handle buyer flow and create connection request when confirmed', async () => {
    await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_3', From: '+919876543210', To: '+919417000000' });

    // Press 2 for buyers
    let res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_3', From: '+919876543210', Digits: '2' });

    expect(res.status).to.equal(200);
    expect(res.text).to.include('We found buyer');

    // Confirm connection
    res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_3', From: '+919876543210', Digits: '1' });

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Your connection request has been sent');

    // Verify connection request in DB
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM connection_requests WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1", ['usr_farmer_1'], (err, r) => {
        if (err) return reject(err);
        resolve(r);
      });
    });

    expect(row).to.exist;
    expect(row.buyer_listing_id).to.match(/buyer_list_/);
  });

  it('should play guidance for option 3', async () => {
    const res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_4', From: '+919876543210', To: '+919417000000', Digits: '3' });

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Crop residue management advice');
  });

  it('should handle invalid secret token with 403 when configured', async () => {
    process.env.EXOTEL_WEBHOOK_SECRET = 'SOMETHING';
    const res = await request(app)
      .post('/api/v1/ivr/exotel')
      .type('form')
      .send({ CallSid: 'TEST_CALL_5', From: '+919876543210' });

    expect(res.status).to.equal(403);
    delete process.env.EXOTEL_WEBHOOK_SECRET;
  });
});
