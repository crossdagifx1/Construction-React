import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/HAVI LOGO.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const cleanEmail = email.trim();
    try {
      const loggedInAdmin = await login(cleanEmail, password);
      if (loggedInAdmin?.role === "TECHNICAL_ADMIN") {
        navigate("/admin/tech/ai");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm rounded-3xl border border-paper/10 bg-paper p-8 lg:p-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="HAVI'S DESIGN" className="h-14 w-14 rounded-full" />
          <h1 className="mt-4 font-display text-2xl tracking-tightest">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-stone">Manage your site content</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line bg-white px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
            {!busy && (
              <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
