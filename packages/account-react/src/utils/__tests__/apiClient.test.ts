import axios, { type AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, createApiClient } from '../apiClient';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Create a mock for axios.create
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    response: {
      use: vi.fn(),
    },
  },
};

mockedAxios.create = vi.fn(() => mockAxiosInstance as unknown as AxiosInstance);

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient({ baseUrl: 'https://api.example.com' });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should remove trailing slash from base URL', () => {
      new ApiClient({ baseUrl: 'https://api.example.com/' });
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use custom timeout', () => {
      new ApiClient({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
      });
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('get method', () => {
    it('should make GET request with correct parameters', async () => {
      const mockResponse = { data: 'test' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {});
      expect(result).toEqual(mockResponse);
    });

    it('should append query parameters correctly', async () => {
      const mockResponse = { data: 'test' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      await client.get('/test', { param1: 'value1', param2: 'value2' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
        params: { param1: 'value1', param2: 'value2' },
      });
    });

    it('should handle empty parameters', async () => {
      const mockResponse = { data: 'test' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      await client.get('/test', {});

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
        params: {},
      });
    });
  });

  describe('post method', () => {
    it('should make POST request with correct data', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'test', value: 123 };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.post('/test', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without data', async () => {
      const mockResponse = { success: true };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      await client.post('/test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', undefined);
    });
  });

  describe('put method', () => {
    it('should make PUT request with correct data', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'updated', value: 456 };

      mockAxiosInstance.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.put('/test', requestData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete method', () => {
    it('should make DELETE request', async () => {
      const mockResponse = { success: true };

      mockAxiosInstance.delete.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createApiClient factory', () => {
    it('should create ApiClient instance', () => {
      const config = { baseUrl: 'https://test.com' };
      const instance = createApiClient(config);

      expect(instance).toBeInstanceOf(ApiClient);
    });
  });
});
