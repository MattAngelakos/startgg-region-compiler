import {dbConnection} from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

export const regions = getCollectionFn('regions');
export const players = getCollectionFn('players');
export const tournaments = getCollectionFn('tournaments');
export const users = getCollectionFn('users');
export const games = getCollectionFn('games');
