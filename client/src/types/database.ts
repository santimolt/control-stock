import type { DBSchema } from 'idb';
import type { Product } from './product';
import type { Movement } from './movement';
import type { Photo } from './photo';

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
  photos: {
    key: string;
    value: Photo;
    indexes: {
      'by-product': string;
      'by-created': Date;
    };
  };
}

export const DB_VERSION = 3;
export const DB_NAME = 'control-stock-db';

