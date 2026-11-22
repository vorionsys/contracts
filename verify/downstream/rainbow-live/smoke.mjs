import { Rainbow, VERSION, BusSeverity, BusSignalType } from '@vorionsys/rainbow';
const r = new Rainbow();
const ok = VERSION === '0.3.0'
  && Object.keys(BusSeverity).length === 5
  && Object.keys(BusSignalType).length === 15
  && typeof r.ingest === 'function';
console.log('VERSION=' + VERSION + ' BusSeverity=' + Object.keys(BusSeverity).length + ' BusSignalType=' + Object.keys(BusSignalType).length);
if (!ok) { console.error('SMOKE FAILED'); process.exit(1); }
console.log('OK: @vorionsys/rainbow@0.3.0 installs from registry, facade + re-exported enums resolve');
