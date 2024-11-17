import { describe, it, assert } from 'vitest';
import {decimalToBase34, base34ToDecimal, LotteryInterface, generateLottery} from '$lib/server/common';

describe('Base 34 Conversion Tests', () => {
    it('should convert decimal to base 34 correctly', () => {
        assert.equal(decimalToBase34(0),'O');
        assert.equal(decimalToBase34(1),'2');
        assert.equal(decimalToBase34(33),'Z');
        assert.equal(decimalToBase34(34),'2O');
        assert.equal(decimalToBase34(12345),'BP4');
        assert.equal(decimalToBase34(9857),'9IX');
    });

    it('should convert base 34 to decimal correctly', () => {
        assert.equal(base34ToDecimal('O'),0);
        assert.equal(base34ToDecimal('I'),17);
        assert.equal(base34ToDecimal('Z'),33);
        assert.equal(base34ToDecimal('2O'),34);
        assert.equal(base34ToDecimal('BP4'),12345);
        assert.equal(base34ToDecimal('9IX'),9857);
    });

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
