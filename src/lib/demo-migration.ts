import legacy from './legacy-demo-v06.json';
import {demoProfile,type Profile} from './model';
function canonical(value:unknown):unknown{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));
 return value;
}
function content(profile:Profile){const {settings:_,...record}=profile;return JSON.stringify(canonical(record));}
/** Upgrade only untouched anonymous sample content; edited and cloud profiles are retained. */
export function refreshAnonymousDemo(profile:Profile):Profile{
 if(content(profile)!==content(legacy as Profile))return profile;
 const updated=structuredClone(demoProfile);
 updated.settings={...profile.settings,siteTitle:profile.settings.siteTitle===legacy.settings.siteTitle?demoProfile.settings.siteTitle:profile.settings.siteTitle,slug:profile.settings.slug===legacy.settings.slug?demoProfile.settings.slug:profile.settings.slug};
 return updated;
}
