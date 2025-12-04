const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-gray-950 w-full h-screen dark text-gray-200">
      {children}
    </div>
  );
};

export default AuthLayout;
