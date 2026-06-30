/**
 * Instead of repeating:

<input />
<input />
<input />

on every page, we create one reusable component.

 * Reusable Input Component
 *
 * Props:
 * - label
 * - type
 * - value
 * - onChange
 * - placeholder
 */

function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="
                w-full
                rounded-lg
                border
                border-gray-300
                px-4
                py-3
                outline-none
                focus:border-blue-500
            "
        />
    </div>
  );
}

export default Input;