export default function FormBackButton() {
  return (
    <button
      type="button"
      className="form-back-button"
      onClick={() => window.history.back()}
      aria-label="Go back to the previous page"
    >
      <span aria-hidden="true">←</span>
      Back
    </button>
  );
}
