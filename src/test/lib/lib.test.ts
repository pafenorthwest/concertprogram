import { describe, it, assert } from 'vitest';
import {
	decimalToBase34,
	base34ToDecimal,
	type LotteryInterface,
	generateLottery
} from '$lib/server/common';

describe('Base 34 Conversion Tests', () => {
    it('should convert decimal to base 34 correctly', () => {
        assert.equal(decimalToBase34(0),'O');
        assert.equal(decimalToBase34(1),'2');
        assert.equal(decimalToBase34(33),'Z');
        assert.equal(decimalToBase34(34),'2O');
        assert.equal(decimalToBase34(12345),'OBP4');
        assert.equal(decimalToBase34(9857),'O9IX');
    });

    it('should convert base 34 to decimal correctly', () => {
        assert.equal(base34ToDecimal('O'),0);
        assert.equal(base34ToDecimal('I'),17);
        assert.equal(base34ToDecimal('Z'),33);
        assert.equal(base34ToDecimal('2O'),34);
        assert.equal(base34ToDecimal('OBP4'),12345);
        assert.equal(base34ToDecimal('O9IX'),9857);
    });

    it('should convert small lottery number to 4 digit code', () => {
        assert.equal(base34ToDecimal('OYA9'),37306)
        assert.equal(decimalToBase34(37306),'OYA9')
    })

    it('should handle round-trip conversion', () => {
        const tickets: LotteryInterface[] = [
            generateLottery(),
            generateLottery(),
            generateLottery(),
            generateLottery(),
            generateLottery(),
            generateLottery(),
            generateLottery(),
        ]
        tickets.forEach(tick => {
            const base34 = decimalToBase34(tick.lottery);
            const decimal = base34ToDecimal(tick.base34Lottery);
            assert.equal(decimal,tick.lottery);
            assert.equal(base34,tick.base34Lottery)
        });
    });
});
