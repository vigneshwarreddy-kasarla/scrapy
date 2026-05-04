
export function Button({ children, className = '', ...props }: any) {
  return (
    <button className={`button ${className}`} {...props}>
      {children}
    </button>
  );
}
