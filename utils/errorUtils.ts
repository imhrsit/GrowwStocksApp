import { APIError, APIErrorType } from '@/services/alphaVantageAPI';

export class ErrorUtils {
    static isRateLimitError(error: Error | APIError): boolean {
        if (error instanceof APIError) {
            return error.type === APIErrorType.RATE_LIMIT;
        }

        const message = error.message.toLowerCase();
        return message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('api call frequency');
    }

    static isNetworkError(error: Error | APIError): boolean {
        if (error instanceof APIError) {
            return error.type === APIErrorType.NETWORK_ERROR || error.type === APIErrorType.TIMEOUT;
        }

        const message = error.message.toLowerCase();
        return message.includes('network') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('econnaborted');
    }

    static isSliceUndefinedError(error: Error | APIError): boolean {
        const message = error.message.toLowerCase();
        return message.includes('cannot read property') && message.includes('slice') && message.includes('undefined');
    }

    static getErrorCategory(error: Error | APIError): string {
        if (this.isRateLimitError(error)) {
            return 'Rate Limit';
        }
        if (this.isNetworkError(error)) {
            return 'Network';
        }
        if (this.isSliceUndefinedError(error)) {
            return 'Data Format';
        }
        if (error instanceof APIError && error.type === APIErrorType.DATA_NOT_AVAILABLE) {
            return 'Data Unavailable';
        }
        return 'Unknown';
    }

    static getSuggestedRetryDelay(error: Error | APIError): number {
        if (error instanceof APIError && error.retryAfter) {
            return error.retryAfter;
        }

        if (this.isRateLimitError(error)) {
            return 300;
        }

        if (this.isNetworkError(error)) {
            return 30;
        }

        return 60;
    }

    static shouldAutoRetry(error: Error | APIError, attemptCount: number = 0): boolean {
        if (attemptCount >= 2) return false;

        if (error instanceof APIError) {
            if (error.type === APIErrorType.INVALID_API_KEY ||
                error.type === APIErrorType.DATA_NOT_AVAILABLE) {
                return false;
            }
            return true;
        }

        return this.isNetworkError(error) || this.isSliceUndefinedError(error);
    }
}

export class ErrorLogger {
    static log(error: Error | APIError, context: string = '') {
        if (__DEV__) {
            console.group(`🚨 API Error ${context ? `(${context})` : ''}`);
            console.log('Type:', ErrorUtils.getErrorCategory(error));
            console.log('Message:', error.message);
            console.log('Should Auto Retry:', ErrorUtils.shouldAutoRetry(error));
            console.log('Suggested Delay:', `${ErrorUtils.getSuggestedRetryDelay(error)}s`);
            if (error instanceof APIError) {
                console.log('API Error Type:', error.type);
                console.log('Retry After:', error.retryAfter);
            }
            console.log('Stack:', error.stack);
            console.groupEnd();
        }
    }
}
