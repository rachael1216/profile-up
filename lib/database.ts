import {env} from 'cloudflare:workers';
import {ApiError} from './request-validation';
export function database(){if(!env.DB)throw new ApiError(503,'云端数据库尚未连接。');return env.DB;}
