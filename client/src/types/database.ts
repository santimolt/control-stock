import type { DBSchema } from 'idb';
import type { Product } from './product';
import type { Movement } from './movement';

export interface StockDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: {
      'by-category': string;
      'by-updated': Date;
    };
  };
  movements: {
    key: string;
    value: Movement;
    indexes: {
      'by-product': string;
      'by-type': string;
      'by-date': Date;
    };
  };
}

export const DB_VERSION = 2;
export const DB_NAME = 'control-stock-db';

