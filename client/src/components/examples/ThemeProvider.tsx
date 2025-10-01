import { ThemeProvider } from '../ThemeProvider';

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <div className="p-4">
        <p>Theme provider example - wraps the entire app</p>
      </div>
    </ThemeProvider>
  );
}