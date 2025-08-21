/**
 * HTTP client for API communication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Parse BigInt values safely - avoid converting already BigInt values
        if (response.data && typeof response.data === 'object') {
          response.data = this.parseResponseData(response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.data) {
          const errorData = error.response.data as any;
          throw new Error(errorData.message || `HTTP ${error.response.status}: ${error.response.statusText}`);
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        }
        throw new Error(error.message || 'Network error');
      }
    );
  }

  private parseResponseData(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string' && /^\d+n?$/.test(data)) {
      // Handle string numbers that might be BigInt
      const cleanValue = data.replace(/n$/, '');
      if (cleanValue.length > 15) {
        try {
          return BigInt(cleanValue);
        } catch {
          return data;
        }
      }
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.parseResponseData(item));
    }
    
    if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.parseResponseData(value);
      }
      return result;
    }
    
    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const config: AxiosRequestConfig = {};
    
    if (params) {
      config.params = params;
    }

    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint);
    return response.data;
  }
}

// Factory function
export const createApiClient = (config: ApiClientConfig) => new ApiClient(config);