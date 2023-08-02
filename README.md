<h1 align="center">i18not</h1>

<p align="center">
Minimalist i18n library.
</p>

<p align="center">
<a href="https://npmjs.com/package/i18not">
<img alt="npm" src="https://img.shields.io/npm/v/i18not">
<img alt="npm" src="https://img.shields.io/npm/dw/i18not">
<img alt="NPM" src="https://img.shields.io/npm/l/i18not">
</a>
</p>

> **Are you a React.js user?** You might be interested in the [react-i18not](https://github.com/mat-sz/react-i18not) package.

## Example usage

```ts
import { init } from 'i18not';

init({
  ns: ['main'],
  defaultNS: 'main',
  load: 'languageOnly',
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  fallbackLng: 'en',
});
```
