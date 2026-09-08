const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('editable net comparison subtracts costs and payoffs on both paths', () => {
  const file = require('node:path').join(__dirname, '../js/seller-worksheet.js');
  assert.ok(fs.existsSync(file), 'seller worksheet implementation exists');
  const { compareNet } = require(file);
  const values = {cash:400000,list:450000,cashCosts:7000,listCosts:9000,commission:4,repairs:20000,monthly:2000,cashMonths:1,listMonths:3,payoff:300000};
  assert.deepEqual(compareNet(values), {cash:91000,list:97000,difference:6000});
  assert.equal(compareNet({...values, payoff:500000}).cash, -109000);
  assert.throws(() => compareNet({...values, commission:101}));
  assert.throws(() => compareNet({...values, cash:''}));
  assert.throws(() => compareNet({...values, repairs:-1}));
});
