#!/usr/bin/env node
/*
 A simple test harness that imports `validateAndNormalizeQuery` from
 `api/convert.js` and runs a few representative test cases.
*/
const path = require('path');

(async () => {
    try {
        const modPath = path.join(__dirname, '..', 'api', 'convert.js');
        const { validateAndNormalizeQuery } = await import('file://' + modPath.replace(/\\/g, '/'));

        const cases = [
            { input: { from: 'USD', to: 'EUR', amount: '100' }, expectOk: true },
            { input: { from: 'usd', to: 'eur', amount: '0.5' }, expectOk: true },
            { input: { from: 'XXX', to: 'EUR' }, expectOk: false },
            { input: { from: 'USD', to: 'EUR', amount: '1e100' }, expectOk: false },
            { input: { from: 'USD', to: 'EUR', amount: '-5' }, expectOk: false },
            { input: { from: 'USD' }, expectOk: false }
        ];

        let failed = 0;
        for (const [i, tcase] of cases.entries()) {
            const res = validateAndNormalizeQuery(tcase.input);
            const ok = !!res.ok;
            if (ok !== tcase.expectOk) {
                console.error(`Test #${i + 1} failed. input=${JSON.stringify(tcase.input)} result=${JSON.stringify(res)}`);
                failed++;
            } else {
                console.log(`Test #${i + 1} passed.`);
            }
        }

        if (failed > 0) {
            console.error(`${failed} test(s) failed.`);
            process.exit(1);
        }
        console.log('All validation tests passed.');
        process.exit(0);
    } catch (err) {
        console.error('Error running validation tests:', err);
        process.exit(2);
    }
})();
