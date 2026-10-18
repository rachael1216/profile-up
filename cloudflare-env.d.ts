declare namespace Cloudflare {
  interface Env {
    SUPABASE_URL?:string;
    SUPABASE_PUBLISHABLE_KEY?:string;
    AUTH_EMAIL_ENABLED?:string;
    AUTH_SMS_ENABLED?:string;
    AUTH_SMS_DAILY_LIMIT?:string;
    TURNSTILE_SITE_KEY?:string;
    ASSETS: Fetcher;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
