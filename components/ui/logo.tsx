export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 50 50"
        className="text-primary"
        fill="currentColor"
      >
        <path
          d="M40 19.9c0-0.1 0-0.2 0-0.3 0-5.5-4.5-10-10-10-4.1 0-7.6 2.5-9.2 6-0.8-0.3-1.8-0.5-2.8-0.5-4.4 0-8 3.6-8 8 0 0.4 0 0.7 0.1 1.1-3 1.1-5.1 4-5.1 7.4 0 4.4 3.6 8 8 8h24c4.4 0 8-3.6 8-8 0-3.9-2.8-7.2-6.6-7.8C38.8 22.7 39.4 21.4 40 19.9z"
          fillOpacity="0.8"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-primary leading-none">ConLab</span>
        <span className="text-sm text-muted-foreground leading-none">Solutions</span>
      </div>
    </div>
  );
}
