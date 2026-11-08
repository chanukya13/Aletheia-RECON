export type IconName =
  | "home"
  | "book"
  | "trace"
  | "flask"
  | "folder"
  | "check"
  | "arrow"
  | "menu"
  | "close"
  | "download"
  | "leaf";
const paths: Record<IconName, string> = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z",
  book: "M12 5v16M3 4c4-1 6-1 9 1 3-2 5-2 9-1v15c-4-1-6-1-9 2-3-3-5-3-9-2Z",
  trace: "M5 3h6v6H5ZM13 15h6v6h-6ZM8 9v9h5M11 6h6v9",
  flask: "M9 3h6M10 3v7L4 20c-.3.5 0 1 1 1h14c1 0 1.3-.5 1-1l-6-10V3M7 15h10",
  folder: "M3 7V5h7l2 3h9v12H3ZM3 8h9",
  check: "m8 12 3 3 5-6M12 2l8 3v7c0 5-8 10-8 10S4 17 4 12V5Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  leaf: "M20 3C9 2 3 7 5 14s12 7 15-11ZM5 21 16 9",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
