declare module '*.module.css' {
  const classes: Readonly<{ readonly [key: string]: string }>
  export default classes
}
