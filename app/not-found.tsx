import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-7xl font-light mb-4">
          404
        </h1>

        <h2 className="text-3xl mb-6">
          Page Not Found
        </h2>

        <p className="mb-8">
          The page you are looking for doesn&apos;t exist.
        </p>

        <Link
          href="/"
          className="inline-flex px-6 py-3 border"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}