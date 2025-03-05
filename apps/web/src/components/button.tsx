import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "border border-gray-200 px-2 py-0.5 hover:bg-gray-500/20",
        props.className
      )}
    >
      {children}
    </button>
  );
}
