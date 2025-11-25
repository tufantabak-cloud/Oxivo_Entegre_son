// Test snake_case converter
function toSnakeCase(str) {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

console.log('🧪 Testing snake_case converter:\n');

const testCases = [
  'linkedBankPFIds',
  'serviceFeeSettings',
  'domainHierarchy',
  'bankDeviceAssignments',
  'cariHesapKodu',
  'guncelMyPayterDomain',
  'salesRepId',
  'ignoreMainDomain',
  'PFOnly',
  'APIKey',
  'HTTPSConnection',
];

testCases.forEach(input => {
  const output = toSnakeCase(input);
  console.log(`${input.padEnd(30)} → ${output}`);
});

console.log('\n✅ Expected outputs:');
console.log('linkedBankPFIds              → linked_bank_pf_ids');
console.log('serviceFeeSettings           → service_fee_settings');
console.log('domainHierarchy              → domain_hierarchy');
