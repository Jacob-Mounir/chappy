import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Login() {
  const navigate = useNavigate();
  const { login, error } = useStore();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate("/");
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
      <div className="w-full max-w-md p-8 space-y-6 bg-[#1f1f1f] rounded-lg">
        <h1 className="text-2xl font-bold text-center text-white">Logga in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Användarnamn"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full bg-[#0C0C0C] border-[#2f2f2f]"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Lösenord"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-[#0C0C0C] border-[#2f2f2f]"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#2f2f2f] hover:bg-[#3f3f3f]"
          >
            Logga in
          </Button>
        </form>
        <p className="text-center text-gray-500">
          Har du inget konto?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-500 hover:underline"
          >
            Registrera dig
          </button>
        </p>
      </div>
    </div>
  );
}
