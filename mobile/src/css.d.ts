// Ambient declarations so TypeScript accepts CSS imports used by the Expo template
// (global.css side-effect import for web fonts; *.module.css for web-only components).
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
