import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
    <div>
      <p className="font-display text-[22vw] leading-none text-ink/10 lg:text-[12rem]">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tightest">
        This space doesn't exist.
      </h1>
      <p className="mt-3 text-stone">The page you're looking for moved or never existed.</p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-ink px-8 py-4 text-sm font-medium text-paper transition-colors hover:bg-accent-deep"
      >
        Back home
      </Link>
    </div>
  </div>
);

export default NotFound;
