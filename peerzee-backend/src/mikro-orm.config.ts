import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const config: Options = {
    driver: PostgreSqlDriver,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'peerzee',
    password: process.env.DB_PASSWORD || 'peerzee',
    dbName: process.env.DB_DATABASE || 'peerzee-db',
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    migrations: {
        path: 'migrations',
    },
    debug: process.env.NODE_ENV !== 'production',
};

export default config;
