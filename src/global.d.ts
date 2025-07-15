declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

interface ContentSectionType {
  title: string;
  body: string;
}

interface ChartDataType {
  name: string;
  value: number;
}