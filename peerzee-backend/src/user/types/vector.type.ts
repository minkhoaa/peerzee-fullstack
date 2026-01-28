import { Type, Platform, EntityProperty, ValidationError } from '@mikro-orm/core';

export class VectorType extends Type<number[], string> {
    convertToDatabaseValue(value: number[] | undefined | null, platform: Platform): string {
        if (value === null || value === undefined) {
            // If the column is nullable, MikroORM might handle null before calling this,
            // or we might need to return a specific string.
            // However, usually for nullable columns, we return null.
            // But we constrained D to string.
            // Let's change D to string | null
            return null as any;
        }

        if (!Array.isArray(value)) {
            if (typeof value === 'string') return value;
            throw new ValidationError(`VectorType expects an array of numbers, got ${typeof value}`);
        }
        return `[${value.join(',')}]`;
    }

    convertToJSValue(value: string | number[] | undefined | null, platform: Platform): number[] {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            return [];
        }
    }

    getColumnType(prop: EntityProperty, platform: Platform) {
        return 'vector(768)';
    }
}
