import LoginForm from "@/features/auth/components/loginForm";

const LoginPage = () => {
  return (
    <div>
      <h1 className="text-white uppercase text-center py-20 text-3xl font-medium">
        Connect <br /> to your account
      </h1>
      <div className="border-t border-gray-700 p-10">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
