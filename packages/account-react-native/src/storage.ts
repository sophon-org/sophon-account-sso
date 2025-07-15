import AsyncStorage from '@react-native-community/async-storage';

function handleError(func: string, param?: string): Promise<string> {
  let message;
  if (!param) {
    message = func;
  } else {
    message = `${func}() requires at least ${param} as its first parameter.`;
  }
  console.warn(message); // eslint-disable-line no-console
  return Promise.reject(message);
}

type KeyType = string;

class SyncStorage {
  data: Map<KeyType, any> = new Map();

  loading: boolean = true;

  init(): Promise<Array<any>> {
    console.log('initializing storage');
    return AsyncStorage.getAllKeys().then((keys: Array<KeyType>) =>
      AsyncStorage.multiGet(keys).then(
        (data: Array<Array<KeyType | null>>): Array<any> => {
          data.forEach(this.saveItem.bind(this));

          return [...this.data];
        }
      )
    );
  }

  getItem(key: KeyType): any {
    return this.data.get(key);
  }

  setItem(key: KeyType, value: any): Promise<any> {
    if (!key) return handleError('set', 'a key');

    this.data.set(key, value);
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  removeItem(key: KeyType): Promise<any> {
    if (!key) return handleError('remove', 'a key');

    this.data.delete(key);
    return AsyncStorage.removeItem(key);
  }

  saveItem(item: Array<KeyType | null>) {
    let value;

    try {
      value = JSON.parse(item[1] || '');
    } catch (e) {
      [, value] = item;
    }

    this.data.set(item[0] || '', value);
    this.loading = false;
  }

  getAllKeys(): Array<any> {
    return Array.from(this.data.keys());
  }
}

export const syncStorage = new SyncStorage();
