
export function Card({ children, className = '', ...props }: any) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
